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

// Time tracking table
export const timeTracking = pgTable("time_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  performerId: varchar("performer_id").notNull().references(() => users.id),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  duration: integer("duration").notNull(), // Duration in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimeTrackingSchema = createInsertSchema(timeTracking).omit({
  id: true,
  createdAt: true,
});

export type InsertTimeTracking = z.infer<typeof insertTimeTrackingSchema>;
export type TimeTracking = typeof timeTracking.$inferSelect;

// Weekly reports table
export const weeklyReports = pgTable("weekly_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  performerId: varchar("performer_id").notNull().references(() => users.id),
  weekStart: text("week_start").notNull(), // Format: YYYY-MM-DD (Monday of the week)
  weekEnd: text("week_end").notNull(), // Format: YYYY-MM-DD (Sunday of the week)
  summary: text("summary").notNull(), // AI-generated summary
  tasksCompleted: integer("tasks_completed").notNull(),
  totalHours: integer("total_hours").notNull(), // Total minutes worked
  evaluation: text("evaluation").notNull(), // AI evaluation
  suggestions: text("suggestions").notNull(), // Learning and internship suggestions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWeeklyReportSchema = createInsertSchema(weeklyReports).omit({
  id: true,
  createdAt: true,
});

export type InsertWeeklyReport = z.infer<typeof insertWeeklyReportSchema>;
export type WeeklyReport = typeof weeklyReports.$inferSelect;

// Questions table (Q&A Community)
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array().notNull(), // AI-generated tags
  category: text("category").notNull().$type<"interview" | "learning_path" | "offer_choice" | "study_plan" | "textbook">(),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  viewCount: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  upvotes: true,
  downvotes: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Comment votes table
export const commentVotes = pgTable("comment_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => comments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  voteType: text("vote_type").notNull().$type<"up" | "down">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserVote: sql`UNIQUE (${table.commentId}, ${table.userId})`,
}));

export const insertCommentVoteSchema = createInsertSchema(commentVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertCommentVote = z.infer<typeof insertCommentVoteSchema>;
export type CommentVote = typeof commentVotes.$inferSelect;

// Saved comments table
export const savedComments = pgTable("saved_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  commentId: varchar("comment_id").notNull().references(() => comments.id),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserComment: sql`UNIQUE (${table.userId}, ${table.commentId})`,
}));

export const insertSavedCommentSchema = createInsertSchema(savedComments).omit({
  id: true,
  createdAt: true,
});

export type InsertSavedComment = z.infer<typeof insertSavedCommentSchema>;
export type SavedComment = typeof savedComments.$inferSelect;

// Saved questions table
export const savedQuestions = pgTable("saved_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserQuestion: sql`UNIQUE (${table.userId}, ${table.questionId})`,
}));

export const insertSavedQuestionSchema = createInsertSchema(savedQuestions).omit({
  id: true,
  createdAt: true,
});

export type InsertSavedQuestion = z.infer<typeof insertSavedQuestionSchema>;
export type SavedQuestion = typeof savedQuestions.$inferSelect;

// Question answers table (AI-generated from saved comments)
export const questionAnswers = pgTable("question_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(), // AI-synthesized answer
  sourceCommentIds: text("source_comment_ids").array().notNull(), // IDs of saved comments used
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserAnswer: sql`UNIQUE (${table.userId}, ${table.questionId})`,
}));

export const insertQuestionAnswerSchema = createInsertSchema(questionAnswers).omit({
  id: true,
  createdAt: true,
});

export type InsertQuestionAnswer = z.infer<typeof insertQuestionAnswerSchema>;
export type QuestionAnswer = typeof questionAnswers.$inferSelect;
