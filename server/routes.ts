import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { analyzeAndBreakdownDemand } from "./ai";
import { insertProjectSchema, insertTaskSchema } from "@shared/schema";
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

  // Get available tasks for performers (performer only)
  app.get("/api/tasks/available", requirePerformer, async (req, res, next) => {
    try {
      const tasks = await storage.getAvailableTasks();
      res.json(tasks);
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

  // Get performer dashboard stats (performer only)
  app.get("/api/performer/stats", requirePerformer, async (req, res, next) => {
    try {
      const submissions = await storage.getSubmissionsByPerformer(req.user!.id);
      const approvedSubmissions = submissions.filter(s => s.status === "approved");
      
      // Get tasks for approved submissions to calculate earnings
      const taskIds = approvedSubmissions.map(s => s.taskId);
      const tasks = await Promise.all(taskIds.map(id => storage.getTask(id)));
      
      const totalEarnings = tasks.reduce((sum, task) => {
        if (task && task.budget) {
          // Extract number from budget string (e.g., "$100" -> 100)
          const amount = parseFloat(task.budget.replace(/[^0-9.]/g, '')) || 0;
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

  const httpServer = createServer(app);

  return httpServer;
}
