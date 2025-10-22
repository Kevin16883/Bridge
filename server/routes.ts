import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { analyzeAndBreakdownDemand } from "./ai";
import { insertProjectSchema, insertTaskSchema, insertTaskSubmissionSchema, insertQuestionSchema } from "@shared/schema";
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
      
      // Get project to find provider and send notification
      const project = await storage.getProject(task.projectId);
      if (project) {
        await storage.createNotification({
          userId: project.providerId,
          type: "task_application",
          content: `${req.user!.username} applied for task: ${task.title}`,
          relatedId: application.id,
        });
      }

      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Get applications for a task (provider only - to see who applied)
  app.get("/api/tasks/:id/applications", requireAuth, async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Get project to verify provider ownership
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
  
  // Accept a task application (provider only)
  app.post("/api/tasks/:taskId/applications/:applicationId/accept", requireProvider, async (req, res, next) => {
    try {
      const { taskId, applicationId } = req.params;
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Verify provider owns this task
      const project = await storage.getProject(task.projectId);
      if (!project || project.providerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get the application to find performer
      const applications = await storage.getApplicationsByTask(taskId);
      const application = applications.find(app => app.id === applicationId);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      // Accept the application
      await storage.updateApplicationStatus(applicationId, "accepted");
      
      // Assign performer to task
      await storage.matchTaskToPerformer(taskId, application.performerId);
      
      // Send notification to performer
      await storage.createNotification({
        userId: application.performerId,
        type: "application_accepted",
        content: `Your application for task "${task.title}" has been accepted!`,
        relatedId: taskId,
      });
      
      // Reject all other pending applications
      const otherApplications = applications.filter(app => app.id !== applicationId && app.status === "pending");
      for (const app of otherApplications) {
        await storage.updateApplicationStatus(app.id, "rejected");
        await storage.createNotification({
          userId: app.performerId,
          type: "application_rejected",
          content: `Your application for task "${task.title}" was not selected.`,
          relatedId: taskId,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  
  // Reject a task application (provider only)
  app.post("/api/tasks/:taskId/applications/:applicationId/reject", requireProvider, async (req, res, next) => {
    try {
      const { taskId, applicationId } = req.params;
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Verify provider owns this task
      const project = await storage.getProject(task.projectId);
      if (!project || project.providerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get the application
      const applications = await storage.getApplicationsByTask(taskId);
      const application = applications.find(app => app.id === applicationId);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      // Reject the application
      await storage.updateApplicationStatus(applicationId, "rejected");
      
      // Send notification to performer
      await storage.createNotification({
        userId: application.performerId,
        type: "application_rejected",
        content: `Your application for task "${task.title}" was not selected.`,
        relatedId: taskId,
      });
      
      res.json({ success: true });
    } catch (error) {
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

  // Get performer's applications with task details (performer only)
  app.get("/api/performer/applications", requirePerformer, async (req, res, next) => {
    try {
      const applications = await storage.getApplicationsWithTaskDetails(req.user!.id);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });

  // Get all applications for provider's tasks (provider only)
  app.get("/api/provider/applications", requireProvider, async (req, res, next) => {
    try {
      const applications = await storage.getApplicationsByProvider(req.user!.id);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });

  // Approve or reject an application (provider only)
  app.patch("/api/applications/:id", requireProvider, async (req, res, next) => {
    try {
      const { status } = req.body;
      
      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
      }
      
      // Verify the application belongs to provider's task
      const applications = await storage.getApplicationsByProvider(req.user!.id);
      const application = applications.find(app => app.id === req.params.id);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found or does not belong to your tasks" });
      }
      
      // Only allow updating pending applications
      if (application.status !== "pending") {
        return res.status(400).json({ error: "Can only update pending applications" });
      }
      
      await storage.updateApplicationStatus(req.params.id, status);
      
      // If accepted, match the task to the performer
      if (status === "accepted") {
        await storage.matchTaskToPerformer(application.taskId, application.performerId);
        
        // Create notification for the performer
        await storage.createNotification({
          userId: application.performerId,
          type: "application_accepted",
          content: `Your application for task "${application.task.title}" has been accepted!`,
          relatedId: application.taskId,
        });
      } else {
        // Create notification for rejection
        await storage.createNotification({
          userId: application.performerId,
          type: "application_rejected",
          content: `Your application for task "${application.task.title}" was not selected.`,
          relatedId: application.taskId,
        });
      }
      
      res.json({ success: true, status });
    } catch (error) {
      next(error);
    }
  });

  // Cancel/delete an application (performer only)
  app.delete("/api/applications/:id", requirePerformer, async (req, res, next) => {
    try {
      // First verify the application belongs to the current performer
      const applications = await storage.getApplicationsByPerformer(req.user!.id);
      const application = applications.find(app => app.id === req.params.id);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      if (application.status !== "pending") {
        return res.status(400).json({ error: "Cannot cancel an application that has already been processed" });
      }

      await storage.deleteApplication(req.params.id);
      res.json({ message: "Application cancelled successfully" });
    } catch (error) {
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

  // Update user profile
  app.patch("/api/user/profile", requireAuth, async (req, res, next) => {
    try {
      // Strict whitelist of allowed profile fields - prevents privilege escalation
      const profileUpdateSchema = z.object({
        avatar: z.string().optional(),
        bio: z.string().max(500).optional(),
        company: z.string().max(100).optional(),
        location: z.string().max(100).optional(),
        website: z.string().url().optional().or(z.literal("")),
        skills: z.array(z.string()).max(20).optional(),
      }).strict(); // .strict() rejects any extra fields
      
      const updateData = profileUpdateSchema.parse(req.body);
      
      // Only allow users to update their own profile
      await storage.updateUserProfile(req.user!.id, updateData);
      const updatedUser = await storage.getUser(req.user!.id);
      
      // Remove sensitive data before sending
      if (updatedUser) {
        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Get user by ID (public profile)
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Q&A Community - Get all questions
  app.get("/api/questions", async (req, res, next) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });

  // Q&A Community - Get a single question
  app.get("/api/questions/:id", async (req, res, next) => {
    try {
      const question = await storage.getQuestionWithAuthor(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Increment view count
      await storage.incrementQuestionViews(req.params.id);
      
      // Get vote count
      const voteCount = await storage.getQuestionVoteCount(req.params.id);
      
      res.json({ ...question, voteCount });
    } catch (error) {
      next(error);
    }
  });

  // Q&A Community - Create a question
  app.post("/api/questions", requireAuth, async (req, res, next) => {
    try {
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });
  
  // Q&A Community - Vote on a question
  app.post("/api/questions/:id/vote", requireAuth, async (req, res, next) => {
    try {
      const { vote } = req.body;
      if (vote !== 1 && vote !== -1) {
        return res.status(400).json({ error: "Vote must be 1 or -1" });
      }
      
      await storage.voteQuestion(req.user!.id, req.params.id, vote);
      const voteCount = await storage.getQuestionVoteCount(req.params.id);
      res.json({ voteCount });
    } catch (error) {
      next(error);
    }
  });
  
  // Q&A Community - Save/bookmark a question
  app.post("/api/questions/:id/save", requireAuth, async (req, res, next) => {
    try {
      await storage.saveQuestion(req.user!.id, req.params.id);
      res.json({ message: "Question saved successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Q&A Community - Unsave a question
  app.delete("/api/questions/:id/save", requireAuth, async (req, res, next) => {
    try {
      await storage.unsaveQuestion(req.user!.id, req.params.id);
      res.json({ message: "Question unsaved successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Q&A Community - Get saved questions
  app.get("/api/saved-questions", requireAuth, async (req, res, next) => {
    try {
      const savedQuestions = await storage.getSavedQuestions(req.user!.id);
      res.json(savedQuestions);
    } catch (error) {
      next(error);
    }
  });
  
  // Q&A Community - Get comments for a question
  app.get("/api/questions/:id/comments", async (req, res, next) => {
    try {
      const comments = await storage.getCommentsByQuestion(req.params.id);
      
      // Get vote counts for each comment
      const commentsWithVotes = await Promise.all(
        comments.map(async (comment) => {
          const voteCount = await storage.getCommentVoteCount(comment.id);
          return { ...comment, voteCount };
        })
      );
      
      res.json(commentsWithVotes);
    } catch (error) {
      next(error);
    }
  });
  
  // Q&A Community - Create a comment
  app.post("/api/questions/:id/comments", requireAuth, async (req, res, next) => {
    try {
      const { content } = req.body;
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }
      
      const comment = await storage.createComment({
        questionId: req.params.id,
        userId: req.user!.id,
        content: content.trim(),
      });
      
      // Get the question to find the author
      const question = await storage.getQuestionWithAuthor(req.params.id);
      
      // Notify the question author if the commenter is not the author
      if (question && question.userId !== req.user!.id) {
        await storage.createNotification({
          userId: question.userId,
          type: "comment",
          content: `${req.user!.username} commented on your question: "${question.title}"`,
          relatedId: question.id,
        });
      }
      
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  });
  
  // Q&A Community - Vote on a comment
  app.post("/api/comments/:id/vote", requireAuth, async (req, res, next) => {
    try {
      const { vote } = req.body;
      if (vote !== 1 && vote !== -1) {
        return res.status(400).json({ error: "Vote must be 1 or -1" });
      }
      
      await storage.voteComment(req.user!.id, req.params.id, vote);
      const voteCount = await storage.getCommentVoteCount(req.params.id);
      res.json({ voteCount });
    } catch (error) {
      next(error);
    }
  });
  
  // Follow operations
  // Follow a user
  app.post("/api/users/:id/follow", requireAuth, async (req, res, next) => {
    try {
      const followingId = req.params.id;
      const followerId = req.user!.id;
      
      if (followingId === followerId) {
        return res.status(400).json({ error: "You cannot follow yourself" });
      }
      
      await storage.followUser(followerId, followingId);
      res.json({ message: "Successfully followed user" });
    } catch (error) {
      next(error);
    }
  });
  
  // Unfollow a user
  app.delete("/api/users/:id/follow", requireAuth, async (req, res, next) => {
    try {
      const followingId = req.params.id;
      const followerId = req.user!.id;
      
      await storage.unfollowUser(followerId, followingId);
      res.json({ message: "Successfully unfollowed user" });
    } catch (error) {
      next(error);
    }
  });
  
  // Get following list
  app.get("/api/following", requireAuth, async (req, res, next) => {
    try {
      const following = await storage.getFollowing(req.user!.id);
      res.json(following);
    } catch (error) {
      next(error);
    }
  });
  
  // Check if following a user
  app.get("/api/users/:id/is-following", requireAuth, async (req, res, next) => {
    try {
      const isFollowing = await storage.isFollowing(req.user!.id, req.params.id);
      res.json({ isFollowing });
    } catch (error) {
      next(error);
    }
  });
  
  // Get user stats (followers and following count)
  app.get("/api/users/:id/stats", async (req, res, next) => {
    try {
      const followersCount = await storage.getFollowersCount(req.params.id);
      const followingCount = await storage.getFollowingCount(req.params.id);
      res.json({ followersCount, followingCount });
    } catch (error) {
      next(error);
    }
  });
  
  // Profile privacy operations
  // Update profile privacy
  app.patch("/api/user/privacy", requireAuth, async (req, res, next) => {
    try {
      const { isPublic } = req.body;
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ error: "isPublic must be a boolean" });
      }
      
      await storage.updateProfilePrivacy(req.user!.id, isPublic);
      res.json({ message: "Privacy settings updated successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // User rating operations
  // Rate a user
  app.post("/api/users/:id/rate", requireAuth, async (req, res, next) => {
    try {
      const { rating, taskId, comment } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }
      
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }
      
      await storage.rateUser(req.params.id, req.user!.id, taskId, rating, comment);
      res.json({ message: "Rating submitted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Get user rating details
  app.get("/api/users/:id/rating", async (req, res, next) => {
    try {
      const averageRating = await storage.getUserAverageRating(req.params.id);
      const ratingCount = await storage.getUserRatingCount(req.params.id);
      res.json({ averageRating, ratingCount });
    } catch (error) {
      next(error);
    }
  });
  
  // Get user's tasks (for display on profile)
  app.get("/api/users/:id/tasks", async (req, res, next) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check privacy settings
      if (user.isProfilePublic === 0 && (!req.user || req.user.id !== user.id)) {
        return res.status(403).json({ error: "This profile is private" });
      }
      
      if (user.role === "performer") {
        // Get tasks matched to this performer
        const tasks = await storage.getTasksByPerformer(req.params.id);
        res.json(tasks);
      } else {
        // Get all projects by this provider, then get all tasks from those projects
        const projects = await storage.getProjectsByProvider(req.params.id);
        const allTasks = [];
        for (const project of projects) {
          const tasks = await storage.getTasksByProject(project.id);
          allTasks.push(...tasks);
        }
        res.json(allTasks);
      }
    } catch (error) {
      next(error);
    }
  });

  // Message routes
  app.post("/api/messages", requireAuth, async (req, res, next) => {
    try {
      const { receiverId, content } = z.object({
        receiverId: z.string(),
        content: z.string().min(1),
      }).parse(req.body);
      
      const message = await storage.createMessage({
        senderId: req.user!.id,
        receiverId,
        content,
      });
      
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });
  
  app.get("/api/messages/conversations", requireAuth, async (req, res, next) => {
    try {
      const conversations = await storage.getConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/messages/:userId", requireAuth, async (req, res, next) => {
    try {
      const messages = await storage.getMessagesBetweenUsers(req.user!.id, req.params.userId);
      
      // Mark messages from the other user as read
      await storage.markMessagesAsRead(req.params.userId, req.user!.id);
      
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
