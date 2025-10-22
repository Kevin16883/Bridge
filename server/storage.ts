import { 
  users, projects, tasks, taskSubmissions, badges, userBadges, taskApplications, questions, notifications, questionVotes, savedQuestions, comments, commentVotes, follows, userRatings, messages,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type TaskSubmission, type InsertTaskSubmission,
  type Badge, type InsertBadge,
  type UserBadge, type InsertUserBadge,
  type TaskApplication, type InsertTaskApplication,
  type Question, type InsertQuestion,
  type Notification, type InsertNotification,
  type Comment, type InsertComment,
  type Follow, type InsertFollow,
  type UserRating, type InsertUserRating,
  type Message, type InsertMessage
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
  updateUserProfile(id: string, data: Partial<Pick<User, 'avatar' | 'bio' | 'company' | 'location' | 'website' | 'skills'>>): Promise<void>;
  
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
  getAvailableTasks(): Promise<Array<Task & { providerUsername: string, providerId: string }>>;
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
  getApplicationsByProvider(providerId: string): Promise<Array<TaskApplication & { task: Task, performer: { id: string, username: string, rating: number } }>>;
  updateApplicationStatus(id: string, status: "pending" | "accepted" | "rejected"): Promise<void>;
  deleteApplication(id: string): Promise<void>;
  
  // Question operations (Q&A Community)
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionWithAuthor(id: string): Promise<(Question & { authorUsername: string }) | undefined>;
  getAllQuestions(): Promise<Array<Question & { authorUsername: string, answerCount: number, commentCount: number }>>;
  incrementQuestionViews(id: string): Promise<void>;
  
  // Question vote operations
  voteQuestion(userId: string, questionId: string, vote: number): Promise<void>;
  getQuestionVote(userId: string, questionId: string): Promise<{ vote: number } | undefined>;
  getQuestionVoteCount(questionId: string): Promise<number>;
  
  // Saved question operations
  saveQuestion(userId: string, questionId: string): Promise<void>;
  unsaveQuestion(userId: string, questionId: string): Promise<void>;
  getSavedQuestions(userId: string): Promise<Array<Question & { authorUsername: string }>>;
  isQuestionSaved(userId: string, questionId: string): Promise<boolean>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByQuestion(questionId: string): Promise<Array<Comment & { authorUsername: string }>>;
  voteComment(userId: string, commentId: string, vote: number): Promise<void>;
  getCommentVote(userId: string, commentId: string): Promise<{ vote: number } | undefined>;
  getCommentVoteCount(commentId: string): Promise<number>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowing(userId: string): Promise<Array<{ id: string, username: string, avatar: string | null, bio: string | null, role: string }>>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowersCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  
  // Profile privacy operations
  updateProfilePrivacy(userId: string, isPublic: boolean): Promise<void>;
  
  // User rating operations
  rateUser(ratedUserId: string, raterUserId: string, taskId: string, rating: number, comment?: string): Promise<void>;
  getUserAverageRating(userId: string): Promise<number>;
  getUserRatingCount(userId: string): Promise<number>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getConversations(userId: string): Promise<Array<{
    userId: string;
    username: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
  }>>;
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Array<Message & { senderUsername: string, receiverUsername: string }>>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
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

  async updateUserProfile(id: string, data: Partial<Pick<User, 'avatar' | 'bio' | 'company' | 'location' | 'website' | 'skills'>>): Promise<void> {
    await db.update(users).set(data).where(eq(users.id, id));
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

  async getAvailableTasks(): Promise<Array<Task & { providerUsername: string, providerId: string }>> {
    const results = await db
      .select({
        task: tasks,
        project: projects,
        provider: users,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(projects.providerId, users.id))
      .where(and(
        eq(tasks.status, "pending"),
        isNull(tasks.matchedPerformerId)
      ));
    
    return results.map(r => ({
      ...r.task,
      providerUsername: r.provider?.username || 'Unknown',
      providerId: r.project?.providerId || '',
    }));
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

  async getApplicationsByProvider(providerId: string): Promise<Array<TaskApplication & { task: Task, performer: { id: string, username: string, rating: number } }>> {
    const results = await db
      .select()
      .from(taskApplications)
      .leftJoin(tasks, eq(taskApplications.taskId, tasks.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(taskApplications.performerId, users.id))
      .where(eq(projects.providerId, providerId))
      .orderBy(desc(taskApplications.appliedAt));
    
    return results.map(r => ({
      ...r.task_applications,
      task: r.tasks!,
      performer: {
        id: r.users!.id,
        username: r.users!.username,
        rating: r.users!.rating
      }
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
  
  async getQuestionWithAuthor(id: string): Promise<(Question & { authorUsername: string }) | undefined> {
    const results = await db
      .select({
        question: questions,
        user: users,
      })
      .from(questions)
      .leftJoin(users, eq(questions.userId, users.id))
      .where(eq(questions.id, id));
    
    if (results.length === 0) return undefined;
    
    return {
      ...results[0].question,
      authorUsername: results[0].user?.username || 'Unknown',
    };
  }
  
  // Question vote operations
  async voteQuestion(userId: string, questionId: string, vote: number): Promise<void> {
    const existing = await db.select().from(questionVotes)
      .where(and(eq(questionVotes.userId, userId), eq(questionVotes.questionId, questionId)));
    
    if (existing.length > 0) {
      if (existing[0].vote === vote) {
        await db.delete(questionVotes).where(eq(questionVotes.id, existing[0].id));
      } else {
        await db.update(questionVotes)
          .set({ vote })
          .where(eq(questionVotes.id, existing[0].id));
      }
    } else {
      await db.insert(questionVotes).values({ userId, questionId, vote });
    }
  }
  
  async getQuestionVote(userId: string, questionId: string): Promise<{ vote: number } | undefined> {
    const [vote] = await db.select().from(questionVotes)
      .where(and(eq(questionVotes.userId, userId), eq(questionVotes.questionId, questionId)));
    return vote ? { vote: vote.vote } : undefined;
  }
  
  async getQuestionVoteCount(questionId: string): Promise<number> {
    const votes = await db.select().from(questionVotes)
      .where(eq(questionVotes.questionId, questionId));
    return votes.reduce((sum, v) => sum + v.vote, 0);
  }
  
  // Saved question operations
  async saveQuestion(userId: string, questionId: string): Promise<void> {
    const existing = await db.select().from(savedQuestions)
      .where(and(eq(savedQuestions.userId, userId), eq(savedQuestions.questionId, questionId)));
    
    if (existing.length === 0) {
      await db.insert(savedQuestions).values({ userId, questionId });
    }
  }
  
  async unsaveQuestion(userId: string, questionId: string): Promise<void> {
    await db.delete(savedQuestions)
      .where(and(eq(savedQuestions.userId, userId), eq(savedQuestions.questionId, questionId)));
  }
  
  async getSavedQuestions(userId: string): Promise<Array<Question & { authorUsername: string }>> {
    const results = await db
      .select({
        question: questions,
        user: users,
      })
      .from(savedQuestions)
      .leftJoin(questions, eq(savedQuestions.questionId, questions.id))
      .leftJoin(users, eq(questions.userId, users.id))
      .where(eq(savedQuestions.userId, userId))
      .orderBy(desc(savedQuestions.createdAt));
    
    return results.map(r => ({
      ...r.question!,
      authorUsername: r.user?.username || 'Unknown',
    }));
  }
  
  async isQuestionSaved(userId: string, questionId: string): Promise<boolean> {
    const [saved] = await db.select().from(savedQuestions)
      .where(and(eq(savedQuestions.userId, userId), eq(savedQuestions.questionId, questionId)));
    return !!saved;
  }
  
  // Comment operations
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }
  
  async getCommentsByQuestion(questionId: string): Promise<Array<Comment & { authorUsername: string, voteCount?: number }>> {
    const results = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.questionId, questionId))
      .orderBy(comments.createdAt);
    
    return results.map(r => ({
      ...r.comment,
      authorUsername: r.user?.username || 'Unknown',
      voteCount: 0,
    }));
  }
  
  async voteComment(userId: string, commentId: string, vote: number): Promise<void> {
    const existing = await db.select().from(commentVotes)
      .where(and(eq(commentVotes.userId, userId), eq(commentVotes.commentId, commentId)));
    
    if (existing.length > 0) {
      if (existing[0].vote === vote) {
        await db.delete(commentVotes).where(eq(commentVotes.id, existing[0].id));
      } else {
        await db.update(commentVotes)
          .set({ vote })
          .where(eq(commentVotes.id, existing[0].id));
      }
    } else {
      await db.insert(commentVotes).values({ userId, commentId, vote });
    }
  }
  
  async getCommentVote(userId: string, commentId: string): Promise<{ vote: number } | undefined> {
    const [vote] = await db.select().from(commentVotes)
      .where(and(eq(commentVotes.userId, userId), eq(commentVotes.commentId, commentId)));
    return vote ? { vote: vote.vote } : undefined;
  }
  
  async getCommentVoteCount(commentId: string): Promise<number> {
    const votes = await db.select().from(commentVotes)
      .where(eq(commentVotes.commentId, commentId));
    return votes.reduce((sum, v) => sum + v.vote, 0);
  }
  
  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }
  
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
  
  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
  }
  
  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      await db.insert(follows).values({ followerId, followingId });
    } catch (error) {
      // Ignore duplicate follow errors
    }
  }
  
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db.delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }
  
  async getFollowing(userId: string): Promise<Array<{ id: string, username: string, avatar: string | null, bio: string | null, role: string }>> {
    const results = await db
      .select({
        user: users,
      })
      .from(follows)
      .leftJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt));
    
    return results.map(r => ({
      id: r.user!.id,
      username: r.user!.username,
      avatar: r.user!.avatar,
      bio: r.user!.bio,
      role: r.user!.role,
    }));
  }
  
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }
  
  async getFollowersCount(userId: string): Promise<number> {
    const followers = await db.select().from(follows)
      .where(eq(follows.followingId, userId));
    return followers.length;
  }
  
  async getFollowingCount(userId: string): Promise<number> {
    const following = await db.select().from(follows)
      .where(eq(follows.followerId, userId));
    return following.length;
  }
  
  // Profile privacy operations
  async updateProfilePrivacy(userId: string, isPublic: boolean): Promise<void> {
    await db.update(users).set({ isProfilePublic: isPublic ? 1 : 0 }).where(eq(users.id, userId));
  }
  
  // User rating operations
  async rateUser(ratedUserId: string, raterUserId: string, taskId: string, rating: number, comment?: string): Promise<void> {
    await db.insert(userRatings).values({
      ratedUserId,
      raterUserId,
      taskId,
      rating,
      comment: comment || null,
    });
    
    // Update user's average rating
    const avgRating = await this.getUserAverageRating(ratedUserId);
    await db.update(users).set({ rating: Math.round(avgRating) }).where(eq(users.id, ratedUserId));
  }
  
  async getUserAverageRating(userId: string): Promise<number> {
    const ratings = await db.select().from(userRatings)
      .where(eq(userRatings.ratedUserId, userId));
    
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / ratings.length;
  }
  
  async getUserRatingCount(userId: string): Promise<number> {
    const ratings = await db.select().from(userRatings)
      .where(eq(userRatings.ratedUserId, userId));
    return ratings.length;
  }
  
  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    
    // Create notification for receiver
    await this.createNotification({
      userId: insertMessage.receiverId,
      type: 'message',
      content: `New message from a user`,
      relatedId: message.id,
    });
    
    return message;
  }
  
  async getConversations(userId: string): Promise<Array<{
    userId: string;
    username: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
  }>> {
    // Get all users the current user has messaged with
    const sentMessages = await db.select({
      otherUserId: messages.receiverId,
    }).from(messages)
      .where(eq(messages.senderId, userId));
    
    const receivedMessages = await db.select({
      otherUserId: messages.senderId,
    }).from(messages)
      .where(eq(messages.receiverId, userId));
    
    const otherUserIds = new Set([
      ...sentMessages.map(m => m.otherUserId),
      ...receivedMessages.map(m => m.otherUserId),
    ]);
    
    const conversations = [];
    for (const otherUserId of Array.from(otherUserIds)) {
      // Get last message
      const lastMessages = await db.select()
        .from(messages)
        .where(
          and(
            eq(messages.senderId, userId),
            eq(messages.receiverId, otherUserId)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      const lastReceivedMessages = await db.select()
        .from(messages)
        .where(
          and(
            eq(messages.senderId, otherUserId),
            eq(messages.receiverId, userId)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      const allLast = [...lastMessages, ...lastReceivedMessages].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const lastMessage = allLast[0];
      
      if (!lastMessage) continue;
      
      // Get unread count
      const unreadMessages = await db.select()
        .from(messages)
        .where(
          and(
            eq(messages.senderId, otherUserId),
            eq(messages.receiverId, userId),
            eq(messages.isRead, 0)
          )
        );
      
      // Get other user's info
      const otherUser = await this.getUser(otherUserId);
      if (!otherUser) continue;
      
      conversations.push({
        userId: otherUserId,
        username: otherUser.username,
        lastMessage: lastMessage.content,
        lastMessageTime: lastMessage.createdAt.toISOString(),
        unreadCount: unreadMessages.length,
      });
    }
    
    // Sort by last message time
    conversations.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
    
    return conversations;
  }
  
  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Array<Message & { senderUsername: string, receiverUsername: string }>> {
    const allMessages = await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, userId1),
          eq(messages.receiverId, userId2)
        )
      );
    
    const allMessages2 = await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, userId2),
          eq(messages.receiverId, userId1)
        )
      );
    
    const combined = [...allMessages, ...allMessages2].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const result = [];
    for (const msg of combined) {
      const sender = await this.getUser(msg.senderId);
      const receiver = await this.getUser(msg.receiverId);
      
      if (sender && receiver) {
        result.push({
          ...msg,
          senderUsername: sender.username,
          receiverUsername: receiver.username,
        });
      }
    }
    
    return result;
  }
  
  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: 1 })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
