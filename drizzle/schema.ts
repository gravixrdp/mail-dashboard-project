import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Companies table
export const companies = mysqlTable(
  "companies",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    emails: text("emails").notNull(),
    notes: text("notes"),
    status: mysqlEnum("status", ["active", "archived", "rejected"]).default("active").notNull(),
    firstAppliedAt: timestamp("firstAppliedAt"),
    lastAppliedAt: timestamp("lastAppliedAt"),
    applicationCount: int("applicationCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("companies_userId_idx").on(table.userId),
  })
);

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// Applications table
export const applications = mysqlTable(
  "applications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    companyId: int("companyId").notNull(),
    hrEmail: varchar("hrEmail", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    emailBody: text("emailBody").notNull(),
    status: mysqlEnum("status", ["sent", "replied", "interview", "rejected", "ghosted", "draft"]).default("draft").notNull(),
    resumeUsed: varchar("resumeUsed", { length: 255 }),
    templateUsed: varchar("templateUsed", { length: 255 }),
    notes: text("notes"),
    sentAt: timestamp("sentAt"),
    repliedAt: timestamp("repliedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("applications_userId_idx").on(table.userId),
    companyIdIdx: index("applications_companyId_idx").on(table.companyId),
    statusIdx: index("applications_status_idx").on(table.status),
  })
);

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

// Email Templates table
export const emailTemplates = mysqlTable(
  "emailTemplates",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    body: text("body").notNull(),
    category: varchar("category", { length: 100 }),
    variables: text("variables"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("emailTemplates_userId_idx").on(table.userId),
  })
);

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// Resumes table
export const resumes = mysqlTable(
  "resumes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    fileKey: varchar("fileKey", { length: 255 }).notNull(),
    fileUrl: text("fileUrl").notNull(),
    isDefault: boolean("isDefault").default(false).notNull(),
    fileSize: int("fileSize"),
    mimeType: varchar("mimeType", { length: 100 }),
    uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("resumes_userId_idx").on(table.userId),
    isDefaultIdx: index("resumes_isDefault_idx").on(table.isDefault),
  })
);

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

// Activity Logs table
export const activityLogs = mysqlTable(
  "activityLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    actionType: varchar("actionType", { length: 100 }).notNull(),
    description: text("description").notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("activityLogs_userId_idx").on(table.userId),
    actionTypeIdx: index("activityLogs_actionType_idx").on(table.actionType),
  })
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// User Settings table
export const userSettings = mysqlTable(
  "userSettings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    phone: varchar("phone", { length: 20 }),
    portfolio: text("portfolio"),
    github: text("github"),
    linkedin: text("linkedin"),
    signature: text("signature"),
    defaultResumeId: int("defaultResumeId"),
    defaultSubject: text("defaultSubject"),
    dailySendLimit: int("dailySendLimit").default(50).notNull(),
    emailDelayMs: int("emailDelayMs").default(5000).notNull(),
    gmailSettings: text("gmailSettings"),
    googleSheetsConfig: text("googleSheetsConfig"),
    theme: mysqlEnum("theme", ["light", "dark", "system"]).default("system").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userSettings_userId_idx").on(table.userId),
  })
);

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// Email Queue table
export const emailQueue = mysqlTable(
  "emailQueue",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    applicationId: int("applicationId"),
    recipient: varchar("recipient", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    body: text("body").notNull(),
    status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
    scheduledAt: timestamp("scheduledAt"),
    sentAt: timestamp("sentAt"),
    failureReason: text("failureReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("emailQueue_userId_idx").on(table.userId),
    statusIdx: index("emailQueue_status_idx").on(table.status),
    scheduledAtIdx: index("emailQueue_scheduledAt_idx").on(table.scheduledAt),
  })
);

export type EmailQueue = typeof emailQueue.$inferSelect;
export type InsertEmailQueue = typeof emailQueue.$inferInsert;

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  company: one(companies, {
    fields: [applications.companyId],
    references: [companies.id],
  }),
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const emailQueueRelations = relations(emailQueue, ({ one }) => ({
  application: one(applications, {
    fields: [emailQueue.applicationId],
    references: [applications.id],
  }),
}));