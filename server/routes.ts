import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { analyzeAndBreakdownDemand, generateChallengeContent, evaluateChallengeResponse } from "./ai";
import { insertProjectSchema, insertTaskSchema, insertChallengeSchema, insertChallengeResultSchema } from "@shared/schema";
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

  // Generate challenge content
  app.post("/api/challenges/generate", requireAuth, async (req, res, next) => {
    try {
      const { skillType, difficulty } = z.object({
        skillType: z.enum(["logic", "creative", "technical", "communication"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
      }).parse(req.body);

      const challengeData = await generateChallengeContent(skillType, difficulty);
      
      const challenge = await storage.createChallenge({
        title: challengeData.title,
        description: challengeData.description,
        skillType,
        difficulty,
        duration: challengeData.duration,
        points: challengeData.points,
        content: challengeData.content,
      });

      res.json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Get all challenges
  app.get("/api/challenges", requireAuth, async (req, res, next) => {
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges);
    } catch (error) {
      next(error);
    }
  });

  // Submit challenge response (performer only)
  app.post("/api/challenges/:id/submit", requirePerformer, async (req, res, next) => {
    try {
      const { response } = z.object({ response: z.string() }).parse(req.body);
      const challengeId = req.params.id;

      const targetChallenge = await storage.getChallenge(challengeId);
      
      if (!targetChallenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      const evaluation = await evaluateChallengeResponse(targetChallenge.content, response);

      const result = await storage.createChallengeResult({
        performerId: req.user!.id,
        challengeId,
        response,
        score: evaluation.score,
        feedback: evaluation.feedback,
      });

      // Update skill score
      await storage.upsertSkillScore({
        performerId: req.user!.id,
        skillType: targetChallenge.skillType,
        score: evaluation.score,
      });

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  });

  // Get performer's skill scores (performer only)
  app.get("/api/skills", requirePerformer, async (req, res, next) => {
    try {
      const scores = await storage.getSkillScoresByPerformer(req.user!.id);
      res.json(scores);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
