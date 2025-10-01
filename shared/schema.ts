import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<"provider" | "performer">(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => users.id),
  originalDemand: text("original_demand").notNull(),
  status: text("status").notNull().$type<"draft" | "active" | "completed">().default("draft"),
  totalBudget: text("total_budget"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skills: text("skills").array().notNull(),
  estimatedTime: text("estimated_time").notNull(),
  budget: text("budget").notNull(),
  difficulty: text("difficulty").notNull().$type<"beginner" | "intermediate" | "advanced">(),
  status: text("status").notNull().$type<"pending" | "matched" | "in_progress" | "completed">().default("pending"),
  matchedPerformerId: varchar("matched_performer_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Challenges table
export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skillType: text("skill_type").notNull().$type<"logic" | "creative" | "technical" | "communication">(),
  duration: text("duration").notNull(),
  difficulty: text("difficulty").notNull().$type<"easy" | "medium" | "hard">(),
  points: integer("points").notNull(),
  content: jsonb("content"),
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
});

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

// Challenge results table
export const challengeResults = pgTable("challenge_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id),
  performerId: varchar("performer_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertChallengeResultSchema = createInsertSchema(challengeResults).omit({
  id: true,
  completedAt: true,
});

export type InsertChallengeResult = z.infer<typeof insertChallengeResultSchema>;
export type ChallengeResult = typeof challengeResults.$inferSelect;

// Skill scores table
export const skillScores = pgTable("skill_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  performerId: varchar("performer_id").notNull().references(() => users.id),
  skillType: text("skill_type").notNull(),
  score: integer("score").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSkillScoreSchema = createInsertSchema(skillScores).omit({
  id: true,
  updatedAt: true,
});

export type InsertSkillScore = z.infer<typeof insertSkillScoreSchema>;
export type SkillScore = typeof skillScores.$inferSelect;

// Task applications table
export const taskApplications = pgTable("task_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  performerId: varchar("performer_id").notNull().references(() => users.id),
  status: text("status").notNull().$type<"pending" | "accepted" | "rejected">().default("pending"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

export const insertTaskApplicationSchema = createInsertSchema(taskApplications).omit({
  id: true,
  appliedAt: true,
});

export type InsertTaskApplication = z.infer<typeof insertTaskApplicationSchema>;
export type TaskApplication = typeof taskApplications.$inferSelect;
