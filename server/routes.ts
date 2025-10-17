import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { analyzeAndBreakdownDemand } from "./ai";
import { insertProjectSchema, insertTaskSchema, insertTaskSubmissionSchema } from "@shared/schema";
import { z } from "zod";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireProvider(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "provider") {
    return res.status(403).json({ error: "This action requires provider role" });
  }
  next();
}

function requirePerformer(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "performer") {
    return res.status(403).json({ error: "This action requires performer role" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // AI-powered demand analysis and task breakdown (provider only)
  app.post("/api/projects/analyze", requireProvider, async (req, res, next) => {
    try {
      const { demand } = z.object({ demand: z.string().min(10) }).parse(req.body);
      
      const breakdown = await analyzeAndBreakdownDemand(demand);
      res.json(breakdown);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // AI-powered one-click project creation (provider only)
  app.post("/api/projects/ai-create", requireProvider, async (req, res, next) => {
    try {
      const { demand } = z.object({ demand: z.string().min(10) }).parse(req.body);
      
      // Analyze demand
      const breakdown = await analyzeAndBreakdownDemand(demand);
      
      // Create project
      const project = await storage.createProject({
        providerId: req.user!.id,
        originalDemand: demand,
        status: "active",
        totalBudget: breakdown.totalBudget,
      });

      // Create tasks
      const createdTasks = await storage.createTasks(
        breakdown.tasks.map((task) => ({
          projectId: project.id,
          title: task.title,
          description: task.description,
          skills: task.skills,
          estimatedTime: task.estimatedTime,
          budget: task.budget,
          difficulty: task.difficulty,
          status: "pending" as const,
        }))
      );

      res.status(201).json({ project, tasks: createdTasks, breakdown });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Create project with custom tasks (edited AI or manual) (provider only)
  app.post("/api/projects/custom-create", requireProvider, async (req, res, next) => {
    try {
      const validated = z.object({
        demand: z.string().min(10),
        totalBudget: z.number().positive(),
        tasks: z.array(z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          skills: z.array(z.string()),
          estimatedTime: z.string(),
          budget: z.number().positive(),
          difficulty: z.enum(["easy", "medium", "hard"]),
        })).min(1, "At least one task is required"),
      }).parse(req.body);

      // Create project
      const project = await storage.createProject({
        providerId: req.user!.id,
        originalDemand: validated.demand,
        status: "active",
        totalBudget: validated.totalBudget,
      });

      // Create tasks
      const createdTasks = await storage.createTasks(
        validated.tasks.map((task) => ({
          projectId: project.id,
          title: task.title,
          description: task.description,
          skills: task.skills,
          estimatedTime: task.estimatedTime,
          budget: task.budget,
          difficulty: task.difficulty,
          status: "pending" as const,
        }))
      );

      res.status(201).json({ project, tasks: createdTasks });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Create project with AI-generated tasks (provider only)
  app.post("/api/projects", requireProvider, async (req, res, next) => {
    try {
      const validatedProject = insertProjectSchema.extend({
        tasks: z.array(insertTaskSchema.omit({ id: true, projectId: true })).optional(),
      }).parse(req.body);

      const project = await storage.createProject({
        providerId: req.user!.id,
        originalDemand: validatedProject.originalDemand,
        status: validatedProject.status as "draft" | "active" | "completed" | undefined || "draft",
        totalBudget: validatedProject.totalBudget,
      });

      let createdTasks: any[] = [];
      if (validatedProject.tasks && validatedProject.tasks.length > 0) {
        createdTasks = await storage.createTasks(
          validatedProject.tasks.map((task: any) => ({
            ...task,
            projectId: project.id,
            status: "pending" as const,
          }))
        );
      }

      res.status(201).json({ project, tasks: createdTasks });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Get projects for current user (provider only)
  app.get("/api/projects", requireProvider, async (req, res, next) => {
    try {
      const projects = await storage.getProjectsByProvider(req.user!.id);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  // Get specific project with tasks (provider only, own projects)
  app.get("/api/projects/:id", requireProvider, async (req, res, next) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check ownership
      if (project.providerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tasks = await storage.getTasksByProject(req.params.id);
      res.json({ project, tasks });
    } catch (error) {
      next(error);
    }
  });

  // Get all available tasks (for task browsing)
  app.get("/api/tasks", requireAuth, async (req, res, next) => {
    try {
      // Return available tasks for performers, or all tasks for providers
      if (req.user!.role === "performer") {
        const tasks = await storage.getAvailableTasks();
        res.json(tasks);
      } else {
        // Providers can see all tasks from their projects
        const projects = await storage.getProjectsByProvider(req.user!.id);
        const allTasks = await Promise.all(
          projects.map(p => storage.getTasksByProject(p.id))
        );
        res.json(allTasks.flat());
      }
    } catch (error) {
      next(error);
    }
  });

  // Get available tasks for performers (performer only)
  app.get("/api/tasks/available", requirePerformer, async (req, res, next) => {
    try {
      const tasks = await storage.getAvailableTasks();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  // Get specific task (provider or assigned performer)
  app.get("/api/tasks/:id", requireAuth, async (req, res, next) => {
    try {
      const task = await storage.getTask(req.params.id);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Allow access for providers (own project) or performers
      if (req.user!.role === "provider") {
        const project = await storage.getProject(task.projectId);
        if (!project || project.providerId !== req.user!.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.user!.role === "performer") {
        // Performers can view:
        // 1. Available tasks (pending, no matchedPerformerId) - to apply
        // 2. Tasks assigned to them (matchedPerformerId matches)
        const isAvailable = task.status === "pending" && !task.matchedPerformerId;
        const isAssigned = task.matchedPerformerId === req.user!.id;
        
        if (!isAvailable && !isAssigned) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  // Get all badge definitions (available to all authenticated users)
  app.get("/api/badges", requireAuth, async (req, res, next) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      next(error);
    }
  });

  // Get performer's earned badges (performer only)
  app.get("/api/performer/badges", requirePerformer, async (req, res, next) => {
    try {
      const userBadges = await storage.getUserBadges(req.user!.id);
      res.json(userBadges);
    } catch (error) {
      next(error);
    }
  });

  // Apply for a task (performer only)
  app.post("/api/tasks/:id/apply", requirePerformer, async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check if task is available (pending and not assigned)
      if (task.status !== "pending" || task.matchedPerformerId) {
        return res.status(400).json({ error: "Task is not available for application" });
      }

      // Check if performer already applied
      const existingApplications = await storage.getApplicationsByTask(taskId);
      const alreadyApplied = existingApplications.some(app => app.performerId === req.user!.id);
      
      if (alreadyApplied) {
        return res.status(400).json({ error: "You have already applied for this task" });
      }

      const application = await storage.createTaskApplication({
        taskId,
        performerId: req.user!.id,
        status: "pending",
      });

      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Update task status/progress (performer only)
  app.patch("/api/tasks/:id/status", requirePerformer, async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check if performer is assigned to this task
      if (task.matchedPerformerId !== req.user!.id) {
        return res.status(403).json({ error: "You are not assigned to this task" });
      }

      const { status } = z.object({
        status: z.enum(["matched", "in_progress", "completed"])
      }).parse(req.body);

      await storage.updateTaskStatus(taskId, status);
      const updatedTask = await storage.getTask(taskId);
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Get pending applications count for provider
  app.get("/api/provider/pending-applications-count", requireProvider, async (req, res, next) => {
    try {
      const projects = await storage.getProjectsByProvider(req.user!.id);
      let totalPendingApplications = 0;

      for (const project of projects) {
        const tasks = await storage.getTasksByProject(project.id);
        for (const task of tasks) {
          if (task.status === "pending" && !task.matchedPerformerId) {
            const applications = await storage.getApplicationsByTask(task.id);
            const pendingApps = applications.filter(app => app.status === "pending");
            totalPendingApplications += pendingApps.length;
          }
        }
      }

      res.json({ count: totalPendingApplications });
    } catch (error) {
      next(error);
    }
  });

  // Get applications for a task (provider only)
  app.get("/api/tasks/:id/applications", requireProvider, async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Verify provider owns this project
      const project = await storage.getProject(task.projectId);
      if (!project || project.providerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const applications = await storage.getApplicationsByTask(taskId);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });

  // Accept task application and assign performer (provider only)
  app.post("/api/tasks/:taskId/applications/:applicationId/accept", requireProvider, async (req, res, next) => {
    try {
      const { taskId, applicationId } = req.params;
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Verify provider owns this project
      const project = await storage.getProject(task.projectId);
      if (!project || project.providerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get all applications for this task
      const applications = await storage.getApplicationsByTask(taskId);
      const application = applications.find(app => app.id === applicationId);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Update application status to accepted
      await storage.updateApplicationStatus(applicationId, "accepted");
      
      // Reject other applications
      const otherApplications = applications.filter(app => app.id !== applicationId);
      await Promise.all(
        otherApplications.map(app => storage.updateApplicationStatus(app.id, "rejected"))
      );

      // Assign task to performer
      await storage.matchTaskToPerformer(taskId, application.performerId);

      const updatedTask = await storage.getTask(taskId);
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  // Submit work for a task (performer only)
  app.post("/api/tasks/:id/submit", requirePerformer, async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check if performer is assigned to this task
      if (task.matchedPerformerId !== req.user!.id) {
        return res.status(403).json({ error: "You are not assigned to this task" });
      }

      const submissionData = insertTaskSubmissionSchema.parse({
        ...req.body,
        taskId,
        performerId: req.user!.id,
        status: "submitted",
      });

      const submission = await storage.createTaskSubmission(submissionData);
      
      // Update task status to in_progress if not already
      if (task.status === "matched") {
        await storage.updateTaskStatus(taskId, "in_progress");
      }

      res.json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Get all submissions for a task (provider or assigned performer)
  app.get("/api/tasks/:id/submissions", requireAuth, async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Allow access for providers (own project) or assigned performers
      if (req.user!.role === "provider") {
        const project = await storage.getProject(task.projectId);
        if (!project || project.providerId !== req.user!.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.user!.role === "performer") {
        if (task.matchedPerformerId !== req.user!.id) {
          return res.status(403).json({ error: "You are not assigned to this task" });
        }
      }

      const submissions = await storage.getSubmissionsByTask(taskId);
      res.json(submissions);
    } catch (error) {
      next(error);
    }
  });

  // Get performer's submissions (performer only)
  app.get("/api/performer/submissions", requirePerformer, async (req, res, next) => {
    try {
      const submissions = await storage.getSubmissionsByPerformer(req.user!.id);
      res.json(submissions);
    } catch (error) {
      next(error);
    }
  });

  // Review a submission (provider only, own project tasks)
  app.post("/api/submissions/:id/review", requireProvider, async (req, res, next) => {
    try {
      const submissionId = req.params.id;
      const reviewSchema = z.object({
        status: z.enum(["approved", "rejected", "revision_requested"]),
        feedback: z.string().optional(),
      }).refine(data => {
        // Require feedback for rejected and revision_requested statuses
        if ((data.status === "rejected" || data.status === "revision_requested") && !data.feedback?.trim()) {
          return false;
        }
        return true;
      }, {
        message: "Feedback is required for rejected and revision_requested statuses",
        path: ["feedback"],
      });
      
      const { status, feedback } = reviewSchema.parse(req.body);

      const submission = await storage.getTaskSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      // Verify the task belongs to provider's project
      const task = await storage.getTask(submission.taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const project = await storage.getProject(task.projectId);
      if (!project || project.providerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Only award badges if transitioning from non-approved to approved
      const wasAlreadyApproved = submission.status === "approved";
      
      // Update submission status
      await storage.updateSubmissionStatus(submissionId, status, feedback);

      // If approved for the first time, update task status to completed and award badges
      if (status === "approved" && !wasAlreadyApproved) {
        await storage.updateTaskStatus(task.id, "completed");
        
        // Award badges to performer
        const performerId = submission.performerId;
        
        // Get performer's existing badges (fetch once for efficiency)
        const existingBadges = await storage.getUserBadges(performerId);
        const existingBadgeIds = new Set(existingBadges.map(ub => ub.badgeId));
        
        // Get performer's completed tasks count
        const performerTasks = await storage.getTasksByPerformer(performerId);
        const completedTasksCount = performerTasks.filter(t => t.status === "completed").length;
        
        // Award completion badges based on milestones (backfill missed milestones)
        const completionBadges = [
          { count: 1, badgeId: "badge-first-task" },
          { count: 5, badgeId: "badge-5-tasks" },
          { count: 10, badgeId: "badge-10-tasks" },
          { count: 25, badgeId: "badge-25-tasks" },
        ];
        
        for (const milestone of completionBadges) {
          if (completedTasksCount >= milestone.count && !existingBadgeIds.has(milestone.badgeId)) {
            await storage.awardBadge({
              userId: performerId,
              badgeId: milestone.badgeId,
              taskId: task.id,
            });
            // Add to set to prevent duplicate awards in same request
            existingBadgeIds.add(milestone.badgeId);
          }
        }
        
        // Award specialty badges based on task skills
        const skillBadgeMap: Record<string, string> = {
          "Content Writing": "badge-content-creator",
          "Copywriting": "badge-content-creator",
          "Data Analysis": "badge-data-wizard",
          "Data Visualization": "badge-data-wizard",
          "UI/UX Design": "badge-design-specialist",
          "Graphic Design": "badge-design-specialist",
          "Web Development": "badge-tech-guru",
          "Backend Development": "badge-tech-guru",
          "API Integration": "badge-tech-guru",
        };
        
        // Check if performer has completed 3+ tasks with specific skills to earn specialty badge
        for (const skill of task.skills) {
          const badgeId = skillBadgeMap[skill];
          if (badgeId && !existingBadgeIds.has(badgeId)) {
            const tasksWithSkill = performerTasks.filter(t => 
              t.status === "completed" && t.skills.includes(skill)
            );
            
            if (tasksWithSkill.length >= 3) {
              await storage.awardBadge({
                userId: performerId,
                badgeId: badgeId,
                taskId: task.id,
              });
              // Add to set to prevent duplicate awards in same request
              existingBadgeIds.add(badgeId);
            }
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Get performer's assigned tasks with latest submission (performer only)
  app.get("/api/performer/my-tasks", requirePerformer, async (req, res, next) => {
    try {
      const tasks = await storage.getTasksByPerformer(req.user!.id);
      const submissions = await storage.getSubmissionsByPerformer(req.user!.id);
      
      // Create a map of taskId to latest submission
      const submissionMap = new Map();
      submissions.forEach(sub => {
        if (!submissionMap.has(sub.taskId) || 
            new Date(sub.submittedAt) > new Date(submissionMap.get(sub.taskId).submittedAt)) {
          submissionMap.set(sub.taskId, sub);
        }
      });

      // Attach latest submission to each task
      const tasksWithSubmissions = tasks.map(task => ({
        ...task,
        latestSubmission: submissionMap.get(task.id),
      }));

      res.json(tasksWithSubmissions);
    } catch (error) {
      next(error);
    }
  });

  // Get performer dashboard stats (performer only)
  app.get("/api/performer/stats", requirePerformer, async (req, res, next) => {
    try {
      const submissions = await storage.getSubmissionsByPerformer(req.user!.id);
      const approvedSubmissions = submissions.filter(s => s.status === "approved");
      
      // Get tasks for approved submissions to calculate earnings
      const taskIds = approvedSubmissions.map(s => s.taskId);
      const tasks = await Promise.all(taskIds.map(id => storage.getTask(id)));
      
      const totalEarnings = tasks.reduce((sum, task) => {
        if (task?.budget) {
          // Handle both number and string budget formats
          const amount = typeof task.budget === "number" 
            ? task.budget 
            : parseFloat(String(task.budget).replace(/[^0-9.]/g, '')) || 0;
          return sum + amount;
        }
        return sum;
      }, 0);

      // Get user's earned badges
      const userBadges = await storage.getUserBadges(req.user!.id);

      res.json({
        completedTasks: approvedSubmissions.length,
        totalEarnings: Math.round(totalEarnings),
        totalBadges: userBadges.length,
      });
    } catch (error) {
      next(error);
    }
  });

  // Time tracking endpoints (all authenticated users)
  app.post("/api/performer/time-tracking", requireAuth, async (req, res, next) => {
    try {
      const data = z.object({
        taskId: z.string(),
        date: z.string(),
        duration: z.number().positive(),
      }).parse(req.body);

      const tracking = await storage.createTimeTracking({
        performerId: req.user!.id,
        ...data,
      });

      res.json(tracking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  app.get("/api/performer/time-tracking", requireAuth, async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const tracking = await storage.getTimeTrackingByPerformer(
        req.user!.id,
        startDate as string,
        endDate as string
      );
      res.json(tracking);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/performer/daily-time/:date", requireAuth, async (req, res, next) => {
    try {
      const { date } = req.params;
      const dailyTime = await storage.getDailyTimeByPerformer(req.user!.id, date);
      res.json(dailyTime);
    } catch (error) {
      next(error);
    }
  });

  // Weekly report endpoints (all authenticated users)
  app.get("/api/performer/weekly-reports", requireAuth, async (req, res, next) => {
    try {
      const reports = await storage.getWeeklyReportsByPerformer(req.user!.id);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/performer/generate-weekly-report", requireAuth, async (req, res, next) => {
    try {
      const { weekStart, weekEnd } = z.object({
        weekStart: z.string(),
        weekEnd: z.string(),
      }).parse(req.body);

      // Get time tracking data for the week
      const timeData = await storage.getTimeTrackingByPerformer(req.user!.id, weekStart, weekEnd);
      
      // Get all tasks involved
      const taskIds = [...new Set(timeData.map(t => t.taskId))];
      const tasks = await Promise.all(taskIds.map(id => storage.getTask(id)));
      
      // Calculate stats
      const totalMinutes = timeData.reduce((sum, t) => sum + t.duration, 0);
      const tasksCompleted = tasks.filter(t => t?.status === "completed").length;

      // Generate AI-powered summary, evaluation, and suggestions
      const taskDetails = tasks.map(t => ({
        title: t?.title,
        status: t?.status,
        skills: t?.skills,
        difficulty: t?.difficulty,
      })).filter(t => t.title);

      const timeBreakdown = timeData.map(t => {
        const task = tasks.find(ts => ts?.id === t.taskId);
        return {
          task: task?.title,
          hours: Math.floor(t.duration / 60),
          minutes: t.duration % 60,
        };
      });

      const aiPrompt = `As a career mentor and learning advisor, analyze this performer's weekly activity and provide:
1. A concise summary of their work
2. A constructive evaluation of their performance
3. Specific learning suggestions and internship preparation advice

Week Data:
- Total time: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m
- Tasks worked on: ${taskIds.length}
- Tasks completed: ${tasksCompleted}
- Task breakdown: ${JSON.stringify(timeBreakdown, null, 2)}
- Task details: ${JSON.stringify(taskDetails, null, 2)}

Provide the response in JSON format:
{
  "summary": "2-3 sentence summary of the week's work",
  "evaluation": "Constructive evaluation highlighting strengths and areas for improvement",
  "suggestions": "Specific, actionable suggestions for learning and career development, including internship preparation tips"
}`;

      try {
        const openai = (await import("openai")).default;
        const client = new openai({
          baseURL: "https://api.deepseek.com",
          apiKey: process.env.DEEPSEEK_API_KEY,
        });

        const completion = await client.chat.completions.create({
          model: "deepseek-chat",
          messages: [{ role: "user", content: aiPrompt }],
          response_format: { type: "json_object" },
        });

        const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
        const summary = aiResponse.summary || `This week you worked on ${taskIds.length} tasks, spending ${Math.floor(totalMinutes / 60)} hours total.`;
        const evaluation = aiResponse.evaluation || "Keep up the good work and stay focused on your goals.";
        const suggestions = aiResponse.suggestions || "Continue building your skills and consider documenting your learnings.";

        // Create report with AI-generated content
        const report = await storage.createWeeklyReport({
          performerId: req.user!.id,
          weekStart,
          weekEnd,
          summary,
          tasksCompleted,
          totalHours: totalMinutes,
          evaluation,
          suggestions,
        });

        res.json(report);
      } catch (aiError) {
        console.error("AI generation failed, using fallback:", aiError);
        
        // Fallback to simple generation if AI fails
        const taskSummary = tasks.map(t => t?.title).filter(Boolean).join(", ");
        const summary = `This week you worked on ${taskIds.length} tasks: ${taskSummary}. You spent ${Math.floor(totalMinutes / 60)} hours and ${totalMinutes % 60} minutes in total.`;
        const evaluation = tasksCompleted > 0 
          ? `Great work! You completed ${tasksCompleted} task${tasksCompleted > 1 ? 's' : ''} this week. Keep up the momentum!`
          : `You're making progress on your tasks. Focus on completing them to build your portfolio.`;
        const suggestions = `Consider focusing on one task at a time to improve efficiency. Take regular breaks to maintain productivity. Document your learnings for future reference.`;

        const report = await storage.createWeeklyReport({
          performerId: req.user!.id,
          weekStart,
          weekEnd,
          summary,
          tasksCompleted,
          totalHours: totalMinutes,
          evaluation,
          suggestions,
        });

        res.json(report);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
