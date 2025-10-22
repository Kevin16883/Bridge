import { 
  users, projects, tasks, taskSubmissions, badges, userBadges, taskApplications, questions,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type TaskSubmission, type InsertTaskSubmission,
  type Badge, type InsertBadge,
  type UserBadge, type InsertUserBadge,
  type TaskApplication, type InsertTaskApplication,
  type Question, type InsertQuestion
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.SessionStore;
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
  
  // Task submission operations
  createTaskSubmission(submission: InsertTaskSubmission): Promise<TaskSubmission>;
  getTaskSubmission(id: string): Promise<TaskSubmission | undefined>;
  getSubmissionsByTask(taskId: string): Promise<TaskSubmission[]>;
  getSubmissionsByPerformer(performerId: string): Promise<TaskSubmission[]>;
  updateSubmissionStatus(id: string, status: "submitted" | "approved" | "rejected" | "revision_requested", feedback?: string): Promise<void>;
  
  // Badge operations
  createBadge(badge: InsertBadge): Promise<Badge>;
  getAllBadges(): Promise<Badge[]>;
  getBadge(id: string): Promise<Badge | undefined>;
  
  // User badge operations
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge | null>;
  getUserBadges(userId: string): Promise<Array<UserBadge & { badge: Badge }>>;
  
  // Task application operations
  createTaskApplication(application: InsertTaskApplication): Promise<TaskApplication>;
  getApplicationsByTask(taskId: string): Promise<TaskApplication[]>;
  getApplicationsByPerformer(performerId: string): Promise<TaskApplication[]>;
  getApplicationsWithTaskDetails(performerId: string): Promise<Array<TaskApplication & { task: Task }>>;
  updateApplicationStatus(id: string, status: "pending" | "accepted" | "rejected"): Promise<void>;
  deleteApplication(id: string): Promise<void>;
  
  // Question operations (Q&A Community)
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getAllQuestions(): Promise<Array<Question & { authorUsername: string, answerCount: number, commentCount: number }>>;
  incrementQuestionViews(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

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
    return await db.select().from(tasks)
      .where(and(
        eq(tasks.status, "pending"),
        isNull(tasks.matchedPerformerId)
      ));
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

  // Task submission operations
  async createTaskSubmission(insertSubmission: InsertTaskSubmission): Promise<TaskSubmission> {
    const [submission] = await db.insert(taskSubmissions).values(insertSubmission).returning();
    return submission;
  }

  async getTaskSubmission(id: string): Promise<TaskSubmission | undefined> {
    const [submission] = await db.select().from(taskSubmissions).where(eq(taskSubmissions.id, id));
    return submission || undefined;
  }

  async getSubmissionsByTask(taskId: string): Promise<TaskSubmission[]> {
    return await db.select().from(taskSubmissions).where(eq(taskSubmissions.taskId, taskId)).orderBy(desc(taskSubmissions.submittedAt));
  }

  async getSubmissionsByPerformer(performerId: string): Promise<TaskSubmission[]> {
    return await db.select().from(taskSubmissions).where(eq(taskSubmissions.performerId, performerId)).orderBy(desc(taskSubmissions.submittedAt));
  }

  async updateSubmissionStatus(id: string, status: "submitted" | "approved" | "rejected" | "revision_requested", feedback?: string): Promise<void> {
    await db.update(taskSubmissions)
      .set({ 
        status, 
        providerFeedback: feedback,
        reviewedAt: new Date()
      })
      .where(eq(taskSubmissions.id, id));
  }

  // Badge operations
  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const [badge] = await db.insert(badges).values(insertBadge).returning();
    return badge;
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getBadge(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge || undefined;
  }

  // User badge operations
  async awardBadge(insertUserBadge: InsertUserBadge): Promise<UserBadge | null> {
    // Use onConflictDoNothing to make this idempotent (unique constraint on userId, badgeId)
    const [userBadge] = await db
      .insert(userBadges)
      .values(insertUserBadge)
      .onConflictDoNothing()
      .returning();
    return userBadge || null;
  }

  async getUserBadges(userId: string): Promise<Array<UserBadge & { badge: Badge }>> {
    const results = await db
      .select()
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
    
    return results.map(r => ({
      ...r.user_badges,
      badge: r.badges!
    }));
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

  async getApplicationsWithTaskDetails(performerId: string): Promise<Array<TaskApplication & { task: Task }>> {
    const results = await db
      .select()
      .from(taskApplications)
      .leftJoin(tasks, eq(taskApplications.taskId, tasks.id))
      .where(eq(taskApplications.performerId, performerId))
      .orderBy(desc(taskApplications.appliedAt));
    
    return results.map(r => ({
      ...r.task_applications,
      task: r.tasks!
    }));
  }

  async deleteApplication(id: string): Promise<void> {
    await db.delete(taskApplications).where(eq(taskApplications.id, id));
  }

  // Question operations (Q&A Community)
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async getAllQuestions(): Promise<Array<Question & { authorUsername: string, answerCount: number, commentCount: number }>> {
    const results = await db
      .select({
        question: questions,
        user: users,
      })
      .from(questions)
      .leftJoin(users, eq(questions.userId, users.id))
      .orderBy(desc(questions.createdAt));
    
    return results.map(r => ({
      ...r.question,
      authorUsername: r.user?.username || 'Unknown',
      answerCount: 0,
      commentCount: 0,
    }));
  }

  async incrementQuestionViews(id: string): Promise<void> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    if (question) {
      await db.update(questions)
        .set({ viewCount: question.viewCount + 1 })
        .where(eq(questions.id, id));
    }
  }
}

export const storage = new DatabaseStorage();
