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

// Task submissions table
export const taskSubmissions = pgTable("task_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  performerId: varchar("performer_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  status: text("status").notNull().$type<"submitted" | "approved" | "rejected" | "revision_requested">().default("submitted"),
  providerFeedback: text("provider_feedback"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertTaskSubmissionSchema = createInsertSchema(taskSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
});

export type InsertTaskSubmission = z.infer<typeof insertTaskSubmissionSchema>;
export type TaskSubmission = typeof taskSubmissions.$inferSelect;

// Badges table
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull().$type<"completion" | "quality" | "speed" | "specialty">(),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User badges table
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  taskId: varchar("task_id").references(() => tasks.id),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserBadge: sql`UNIQUE (${table.userId}, ${table.badgeId})`,
}));

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

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
