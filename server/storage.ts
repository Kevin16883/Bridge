import { 
  users, projects, tasks, challenges, challengeResults, skillScores, taskApplications,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type Challenge, type InsertChallenge,
  type ChallengeResult, type InsertChallengeResult,
  type SkillScore, type InsertSkillScore,
  type TaskApplication, type InsertTaskApplication
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByProvider(providerId: string): Promise<Project[]>;
  updateProjectStatus(id: string, status: "draft" | "active" | "completed"): Promise<void>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  createTasks(tasks: InsertTask[]): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTasksByPerformer(performerId: string): Promise<Task[]>;
  getAvailableTasks(): Promise<Task[]>;
  updateTaskStatus(id: string, status: "pending" | "matched" | "in_progress" | "completed"): Promise<void>;
  matchTaskToPerformer(taskId: string, performerId: string): Promise<void>;
  
  // Challenge operations
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getAllChallenges(): Promise<Challenge[]>;
  getChallengesBySkillType(skillType: string): Promise<Challenge[]>;
  
  // Challenge result operations
  createChallengeResult(result: InsertChallengeResult): Promise<ChallengeResult>;
  getChallengeResultsByPerformer(performerId: string): Promise<ChallengeResult[]>;
  
  // Skill score operations
  upsertSkillScore(score: InsertSkillScore): Promise<SkillScore>;
  getSkillScoresByPerformer(performerId: string): Promise<SkillScore[]>;
  
  // Task application operations
  createTaskApplication(application: InsertTaskApplication): Promise<TaskApplication>;
  getApplicationsByTask(taskId: string): Promise<TaskApplication[]>;
  getApplicationsByPerformer(performerId: string): Promise<TaskApplication[]>;
  updateApplicationStatus(id: string, status: "pending" | "accepted" | "rejected"): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Project operations
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByProvider(providerId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.providerId, providerId)).orderBy(desc(projects.createdAt));
  }

  async updateProjectStatus(id: string, status: "draft" | "active" | "completed"): Promise<void> {
    await db.update(projects).set({ status }).where(eq(projects.id, id));
  }

  // Task operations
  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async createTasks(insertTasks: InsertTask[]): Promise<Task[]> {
    return await db.insert(tasks).values(insertTasks).returning();
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async getTasksByPerformer(performerId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.matchedPerformerId, performerId));
  }

  async getAvailableTasks(): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.status, "pending"));
  }

  async updateTaskStatus(id: string, status: "pending" | "matched" | "in_progress" | "completed"): Promise<void> {
    await db.update(tasks).set({ status }).where(eq(tasks.id, id));
  }

  async matchTaskToPerformer(taskId: string, performerId: string): Promise<void> {
    await db.update(tasks).set({ 
      matchedPerformerId: performerId,
      status: "matched"
    }).where(eq(tasks.id, taskId));
  }

  // Challenge operations
  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db.insert(challenges).values(insertChallenge).returning();
    return challenge;
  }

  async getAllChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges);
  }

  async getChallengesBySkillType(skillType: string): Promise<Challenge[]> {
    return await db.select().from(challenges).where(eq(challenges.skillType, skillType as any));
  }

  // Challenge result operations
  async createChallengeResult(insertResult: InsertChallengeResult): Promise<ChallengeResult> {
    const [result] = await db.insert(challengeResults).values(insertResult).returning();
    return result;
  }

  async getChallengeResultsByPerformer(performerId: string): Promise<ChallengeResult[]> {
    return await db.select().from(challengeResults).where(eq(challengeResults.performerId, performerId));
  }

  // Skill score operations
  async upsertSkillScore(insertScore: InsertSkillScore): Promise<SkillScore> {
    const existing = await db.select().from(skillScores).where(
      and(
        eq(skillScores.performerId, insertScore.performerId),
        eq(skillScores.skillType, insertScore.skillType)
      )
    );

    if (existing.length > 0) {
      const [updated] = await db.update(skillScores)
        .set({ score: insertScore.score, updatedAt: new Date() })
        .where(eq(skillScores.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(skillScores).values(insertScore).returning();
      return created;
    }
  }

  async getSkillScoresByPerformer(performerId: string): Promise<SkillScore[]> {
    return await db.select().from(skillScores).where(eq(skillScores.performerId, performerId));
  }

  // Task application operations
  async createTaskApplication(insertApplication: InsertTaskApplication): Promise<TaskApplication> {
    const [application] = await db.insert(taskApplications).values(insertApplication).returning();
    return application;
  }

  async getApplicationsByTask(taskId: string): Promise<TaskApplication[]> {
    return await db.select().from(taskApplications).where(eq(taskApplications.taskId, taskId));
  }

  async getApplicationsByPerformer(performerId: string): Promise<TaskApplication[]> {
    return await db.select().from(taskApplications).where(eq(taskApplications.performerId, performerId));
  }

  async updateApplicationStatus(id: string, status: "pending" | "accepted" | "rejected"): Promise<void> {
    await db.update(taskApplications).set({ status }).where(eq(taskApplications.id, id));
  }
}

export const storage = new DatabaseStorage();
