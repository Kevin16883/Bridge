import { 
  users, projects, tasks, taskSubmissions, badges, userBadges, taskApplications, timeTracking, weeklyReports,
  questions, comments, commentVotes, savedComments, savedQuestions, questionAnswers,
  messages, follows, notifications, blockedUsers,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type TaskSubmission, type InsertTaskSubmission,
  type Badge, type InsertBadge,
  type UserBadge, type InsertUserBadge,
  type TaskApplication, type InsertTaskApplication,
  type TimeTracking, type InsertTimeTracking,
  type WeeklyReport, type InsertWeeklyReport,
  type Question, type InsertQuestion,
  type Comment, type InsertComment,
  type CommentVote, type InsertCommentVote,
  type SavedComment, type InsertSavedComment,
  type SavedQuestion, type InsertSavedQuestion,
  type QuestionAnswer, type InsertQuestionAnswer,
  type Message, type InsertMessage,
  type Follow, type InsertFollow,
  type Notification, type InsertNotification,
  type BlockedUser, type InsertBlockedUser
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, sql, alias } from "drizzle-orm";
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
  updateApplicationStatus(id: string, status: "pending" | "accepted" | "rejected"): Promise<void>;
  
  // Time tracking operations
  createTimeTracking(tracking: InsertTimeTracking): Promise<TimeTracking>;
  getTimeTrackingByPerformer(performerId: string, startDate?: string, endDate?: string): Promise<TimeTracking[]>;
  getDailyTimeByPerformer(performerId: string, date: string): Promise<Array<TimeTracking & { task: Task }>>;
  
  // Weekly report operations
  createWeeklyReport(report: InsertWeeklyReport): Promise<WeeklyReport>;
  getWeeklyReportsByPerformer(performerId: string): Promise<WeeklyReport[]>;
  getWeeklyReport(id: string): Promise<WeeklyReport | undefined>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getAllQuestions(category?: string): Promise<Array<Question & { user: User; commentCount: number }>>;
  incrementViewCount(id: string): Promise<void>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByQuestion(questionId: string): Promise<Array<Comment & { user: User }>>;
  deleteComment(id: string): Promise<void>;
  
  // Comment vote operations
  voteComment(vote: InsertCommentVote): Promise<void>;
  removeVote(commentId: string, userId: string): Promise<void>;
  getUserVote(commentId: string, userId: string): Promise<CommentVote | undefined>;
  
  // Saved comments operations
  saveComment(saved: InsertSavedComment): Promise<SavedComment>;
  unsaveComment(userId: string, commentId: string): Promise<void>;
  getSavedCommentsByUser(userId: string, questionId?: string): Promise<Array<SavedComment & { comment: Comment & { user: User } }>>;
  
  // Saved questions operations
  saveQuestion(saved: InsertSavedQuestion): Promise<SavedQuestion>;
  unsaveQuestion(userId: string, questionId: string): Promise<void>;
  getSavedQuestionsByUser(userId: string): Promise<Array<SavedQuestion & { question: Question }>>;
  
  // Question answer operations
  createQuestionAnswer(answer: InsertQuestionAnswer): Promise<QuestionAnswer>;
  getQuestionAnswer(questionId: string, userId: string): Promise<QuestionAnswer | undefined>;
  
  // Avatar operations
  updateUserAvatar(userId: string, avatarUrl: string): Promise<void>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: string, userId2: string): Promise<Array<Message & { sender: User; receiver: User }>>;
  getMessagesByUser(userId: string): Promise<Array<{ otherUser: User; lastMessage: Message; unreadCount: number }>>;
  markMessageAsRead(messageId: string): Promise<void>;
  canSendMessage(senderId: string, receiverId: string): Promise<boolean>;
  
  // Follow operations
  followUser(follow: InsertFollow): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<Array<Follow & { follower: User }>>;
  getFollowing(userId: string): Promise<Array<Follow & { following: User }>>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // Block operations
  blockUser(block: InsertBlockedUser): Promise<BlockedUser>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUsers(userId: string): Promise<Array<BlockedUser & { blocked: User }>>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
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

  // Time tracking operations
  async createTimeTracking(insertTracking: InsertTimeTracking): Promise<TimeTracking> {
    const [tracking] = await db.insert(timeTracking).values(insertTracking).returning();
    return tracking;
  }

  async getTimeTrackingByPerformer(performerId: string, startDate?: string, endDate?: string): Promise<TimeTracking[]> {
    let query = db.select().from(timeTracking).where(eq(timeTracking.performerId, performerId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(timeTracking.performerId, performerId),
          // SQL comparison for date strings in YYYY-MM-DD format
          sql`${timeTracking.date} >= ${startDate}`,
          sql`${timeTracking.date} <= ${endDate}`
        )
      );
    }
    
    return await query.orderBy(desc(timeTracking.date));
  }

  async getDailyTimeByPerformer(performerId: string, date: string): Promise<Array<TimeTracking & { task: Task }>> {
    const results = await db
      .select()
      .from(timeTracking)
      .leftJoin(tasks, eq(timeTracking.taskId, tasks.id))
      .where(
        and(
          eq(timeTracking.performerId, performerId),
          eq(timeTracking.date, date)
        )
      );
    
    return results.map(r => ({
      ...r.time_tracking,
      task: r.tasks!
    }));
  }

  // Weekly report operations
  async createWeeklyReport(insertReport: InsertWeeklyReport): Promise<WeeklyReport> {
    const [report] = await db.insert(weeklyReports).values(insertReport).returning();
    return report;
  }

  async getWeeklyReportsByPerformer(performerId: string): Promise<WeeklyReport[]> {
    return await db
      .select()
      .from(weeklyReports)
      .where(eq(weeklyReports.performerId, performerId))
      .orderBy(desc(weeklyReports.weekStart));
  }

  async getWeeklyReport(id: string): Promise<WeeklyReport | undefined> {
    const [report] = await db.select().from(weeklyReports).where(eq(weeklyReports.id, id));
    return report || undefined;
  }

  // Question operations
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async getAllQuestions(category?: string): Promise<Array<Question & { user: User; commentCount: number }>> {
    let query = db
      .select({
        question: questions,
        user: users,
        commentCount: sql<number>`COUNT(DISTINCT ${comments.id})::int`,
      })
      .from(questions)
      .leftJoin(users, eq(questions.userId, users.id))
      .leftJoin(comments, eq(questions.id, comments.questionId))
      .groupBy(questions.id, users.id);

    if (category) {
      query = query.where(eq(questions.category, category)) as any;
    }

    const results = await query.orderBy(desc(questions.createdAt));
    
    return results.map(r => ({
      ...r.question,
      user: r.user!,
      commentCount: r.commentCount
    }));
  }

  async incrementViewCount(id: string): Promise<void> {
    await db.update(questions).set({ 
      viewCount: sql`${questions.viewCount} + 1` 
    }).where(eq(questions.id, id));
  }

  // Comment operations
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async getCommentsByQuestion(questionId: string): Promise<Array<Comment & { user: User }>> {
    const results = await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.questionId, questionId))
      .orderBy(desc(comments.createdAt));
    
    return results.map(r => ({
      ...r.comments,
      user: r.users!
    }));
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Comment vote operations
  async voteComment(insertVote: InsertCommentVote): Promise<void> {
    // First, remove any existing vote from this user on this comment
    await db.delete(commentVotes).where(
      and(
        eq(commentVotes.commentId, insertVote.commentId),
        eq(commentVotes.userId, insertVote.userId)
      )
    );

    // Insert the new vote
    await db.insert(commentVotes).values(insertVote);

    // Update the comment's vote counts
    const upvoteCount = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(commentVotes)
      .where(
        and(
          eq(commentVotes.commentId, insertVote.commentId),
          eq(commentVotes.voteType, 'up')
        )
      );

    const downvoteCount = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(commentVotes)
      .where(
        and(
          eq(commentVotes.commentId, insertVote.commentId),
          eq(commentVotes.voteType, 'down')
        )
      );

    await db.update(comments).set({
      upvotes: upvoteCount[0].count,
      downvotes: downvoteCount[0].count
    }).where(eq(comments.id, insertVote.commentId));
  }

  async removeVote(commentId: string, userId: string): Promise<void> {
    await db.delete(commentVotes).where(
      and(
        eq(commentVotes.commentId, commentId),
        eq(commentVotes.userId, userId)
      )
    );

    // Update the comment's vote counts
    const upvoteCount = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(commentVotes)
      .where(
        and(
          eq(commentVotes.commentId, commentId),
          eq(commentVotes.voteType, 'up')
        )
      );

    const downvoteCount = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(commentVotes)
      .where(
        and(
          eq(commentVotes.commentId, commentId),
          eq(commentVotes.voteType, 'down')
        )
      );

    await db.update(comments).set({
      upvotes: upvoteCount[0].count,
      downvotes: downvoteCount[0].count
    }).where(eq(comments.id, commentId));
  }

  async getUserVote(commentId: string, userId: string): Promise<CommentVote | undefined> {
    const [vote] = await db.select().from(commentVotes).where(
      and(
        eq(commentVotes.commentId, commentId),
        eq(commentVotes.userId, userId)
      )
    );
    return vote || undefined;
  }

  // Saved comments operations
  async saveComment(insertSaved: InsertSavedComment): Promise<SavedComment> {
    const [saved] = await db.insert(savedComments).values(insertSaved)
      .onConflictDoNothing()
      .returning();
    return saved;
  }

  async unsaveComment(userId: string, commentId: string): Promise<void> {
    await db.delete(savedComments).where(
      and(
        eq(savedComments.userId, userId),
        eq(savedComments.commentId, commentId)
      )
    );
  }

  async getSavedCommentsByUser(userId: string, questionId?: string): Promise<Array<SavedComment & { comment: Comment & { user: User } }>> {
    let query = db
      .select()
      .from(savedComments)
      .leftJoin(comments, eq(savedComments.commentId, comments.id))
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(savedComments.userId, userId));

    if (questionId) {
      query = query.where(
        and(
          eq(savedComments.userId, userId),
          eq(savedComments.questionId, questionId)
        )
      ) as any;
    }

    const results = await query.orderBy(desc(savedComments.createdAt));
    
    return results.map(r => ({
      ...r.saved_comments,
      comment: {
        ...r.comments!,
        user: r.users!
      }
    }));
  }

  // Saved questions operations
  async saveQuestion(insertSaved: InsertSavedQuestion): Promise<SavedQuestion> {
    const [saved] = await db.insert(savedQuestions).values(insertSaved)
      .onConflictDoNothing()
      .returning();
    return saved;
  }

  async unsaveQuestion(userId: string, questionId: string): Promise<void> {
    await db.delete(savedQuestions).where(
      and(
        eq(savedQuestions.userId, userId),
        eq(savedQuestions.questionId, questionId)
      )
    );
  }

  async getSavedQuestionsByUser(userId: string): Promise<Array<SavedQuestion & { question: Question }>> {
    const results = await db
      .select()
      .from(savedQuestions)
      .leftJoin(questions, eq(savedQuestions.questionId, questions.id))
      .where(eq(savedQuestions.userId, userId))
      .orderBy(desc(savedQuestions.createdAt));
    
    return results.map(r => ({
      ...r.saved_questions,
      question: r.questions!
    }));
  }

  // Question answer operations
  async createQuestionAnswer(insertAnswer: InsertQuestionAnswer): Promise<QuestionAnswer> {
    const [answer] = await db.insert(questionAnswers).values(insertAnswer)
      .onConflictDoUpdate({
        target: [questionAnswers.userId, questionAnswers.questionId],
        set: {
          content: insertAnswer.content,
          sourceCommentIds: insertAnswer.sourceCommentIds,
          createdAt: sql`NOW()`
        }
      })
      .returning();
    return answer;
  }

  async getQuestionAnswer(questionId: string, userId: string): Promise<QuestionAnswer | undefined> {
    const [answer] = await db.select().from(questionAnswers).where(
      and(
        eq(questionAnswers.questionId, questionId),
        eq(questionAnswers.userId, userId)
      )
    );
    return answer || undefined;
  }

  // Avatar operations
  async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getConversation(userId1: string, userId2: string): Promise<Array<Message & { sender: User; receiver: User }>> {
    const sender = alias(users, 'sender');
    const receiver = alias(users, 'receiver');
    
    const results = await db
      .select()
      .from(messages)
      .leftJoin(sender, eq(messages.senderId, sender.id))
      .leftJoin(receiver, eq(messages.receiverId, receiver.id))
      .where(
        sql`(${messages.senderId} = ${userId1} AND ${messages.receiverId} = ${userId2}) OR (${messages.senderId} = ${userId2} AND ${messages.receiverId} = ${userId1})`
      )
      .orderBy(messages.createdAt);
    
    return results.map(r => ({
      ...r.messages,
      sender: r.sender!,
      receiver: r.receiver!
    }));
  }

  async getMessagesByUser(userId: string): Promise<Array<{ otherUser: User; lastMessage: Message; unreadCount: number }>> {
    // Get distinct conversations with last message
    const conversations = await db.execute(sql`
      WITH message_with_other AS (
        SELECT 
          *,
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id
            ELSE sender_id
          END as other_user_id
        FROM messages
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
      ),
      last_messages AS (
        SELECT DISTINCT ON (other_user_id)
          *
        FROM message_with_other
        ORDER BY other_user_id, created_at DESC
      )
      SELECT 
        lm.*,
        u.id as user_id, u.username, u.role, u.email, u.avatar_url, u.created_at as user_created_at,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.sender_id = lm.other_user_id 
         AND m.receiver_id = ${userId} 
         AND m.is_read = 0) as unread_count
      FROM last_messages lm
      JOIN users u ON u.id = lm.other_user_id
      ORDER BY lm.created_at DESC
    `);
    
    return conversations.rows.map((row: any) => ({
      otherUser: {
        id: row.user_id,
        username: row.username,
        role: row.role,
        email: row.email,
        avatarUrl: row.avatar_url,
        createdAt: row.user_created_at,
        password: '' // Don't expose password
      },
      lastMessage: {
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        content: row.content,
        isRead: row.is_read,
        createdAt: row.created_at
      },
      unreadCount: parseInt(row.unread_count) || 0
    }));
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db.update(messages).set({ isRead: 1 }).where(eq(messages.id, messageId));
  }

  async canSendMessage(senderId: string, receiverId: string): Promise<boolean> {
    // Check if blocked
    const blocked = await this.isBlocked(receiverId, senderId);
    if (blocked) return false;

    // Check if they're following each other
    const isFollowing = await this.isFollowing(senderId, receiverId);
    const followsBack = await this.isFollowing(receiverId, senderId);
    
    // If either follows, allow messaging
    if (isFollowing || followsBack) return true;
    
    // Check if receiver has replied (sent a message back)
    const [receiverReply] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, receiverId),
          eq(messages.receiverId, senderId)
        )
      )
      .limit(1);
    
    // If receiver has replied, allow messaging
    if (receiverReply) return true;
    
    // Check if sender has already sent a message
    const [senderMessage] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId)
        )
      )
      .limit(1);
    
    // If sender hasn't sent a message yet, allow the first one
    return !senderMessage;
  }

  // Follow operations
  async followUser(insertFollow: InsertFollow): Promise<Follow> {
    const [follow] = await db.insert(follows).values(insertFollow)
      .onConflictDoNothing()
      .returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db.delete(follows).where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      )
    );
  }

  async getFollowers(userId: string): Promise<Array<Follow & { follower: User }>> {
    const results = await db
      .select()
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId))
      .orderBy(desc(follows.createdAt));
    
    return results.map(r => ({
      ...r.follows,
      follower: r.users!
    }));
  }

  async getFollowing(userId: string): Promise<Array<Follow & { following: User }>> {
    const results = await db
      .select()
      .from(follows)
      .leftJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt));
    
    return results.map(r => ({
      ...r.follows,
      following: r.users!
    }));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db.select().from(follows).where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      )
    );
    return !!follow;
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, 0)
        )
      );
    return result?.count || 0;
  }

  // Block operations
  async blockUser(insertBlock: InsertBlockedUser): Promise<BlockedUser> {
    const [block] = await db.insert(blockedUsers).values(insertBlock)
      .onConflictDoNothing()
      .returning();
    return block;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db.delete(blockedUsers).where(
      and(
        eq(blockedUsers.blockerId, blockerId),
        eq(blockedUsers.blockedId, blockedId)
      )
    );
  }

  async getBlockedUsers(userId: string): Promise<Array<BlockedUser & { blocked: User }>> {
    const results = await db
      .select()
      .from(blockedUsers)
      .leftJoin(users, eq(blockedUsers.blockedId, users.id))
      .where(eq(blockedUsers.blockerId, userId))
      .orderBy(desc(blockedUsers.createdAt));
    
    return results.map(r => ({
      ...r.blocked_users,
      blocked: r.users!
    }));
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [block] = await db.select().from(blockedUsers).where(
      and(
        eq(blockedUsers.blockerId, blockerId),
        eq(blockedUsers.blockedId, blockedId)
      )
    );
    return !!block;
  }
}

export const storage = new DatabaseStorage();
