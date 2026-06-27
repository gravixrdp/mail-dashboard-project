import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: text("createdAt").$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").$defaultFn(() => new Date().toISOString()).notNull(),
  lastSignedIn: text("lastSignedIn").$defaultFn(() => new Date().toISOString()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  emails: text("emails").notNull(),
  notes: text("notes"),
  status: text("status").default("active").notNull(),
  firstAppliedAt: text("firstAppliedAt"),
  lastAppliedAt: text("lastAppliedAt"),
  applicationCount: integer("applicationCount").default(0).notNull(),
  createdAt: text("createdAt").$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").$defaultFn(() => new Date().toISOString()).notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  companyId: integer("companyId").notNull(),
  hrEmail: text("hrEmail").notNull(),
  subject: text("subject").notNull(),
  emailBody: text("emailBody").notNull(),
  status: text("status").default("draft").notNull(),
  resumeUsed: text("resumeUsed"),
  templateUsed: text("templateUsed"),
  notes: text("notes"),
  sentAt: text("sentAt"),
  repliedAt: text("repliedAt"),
  createdAt: text("createdAt").$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").$defaultFn(() => new Date().toISOString()).notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export const emailTemplates = sqliteTable("emailTemplates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: text("category"),
  variables: text("variables"),
  createdAt: text("createdAt").$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").$defaultFn(() => new Date().toISOString()).notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export const resumes = sqliteTable("resumes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  filename: text("filename").notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  isDefault: integer("isDefault", { mode: "boolean" }).default(false).notNull(),
  fileSize: integer("fileSize"),
  mimeType: text("mimeType"),
  uploadedAt: text("uploadedAt").$defaultFn(() => new Date().toISOString()).notNull(),
  createdAt: text("createdAt").$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").$defaultFn(() => new Date().toISOString()).notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

export const activityLogs = sqliteTable("activityLogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  actionType: text("actionType").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdAt: text("createdAt").$defaultFn(() => new Date().toISOString()).notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

export const userSettings = sqliteTable("userSettings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  phone: text("phone"),
  portfolio: text("portfolio"),
  github: text("github"),
  linkedin: text("linkedin"),
  signature: text("signature"),
  defaultResumeId: integer("defaultResumeId"),
  defaultSubject: text("defaultSubject"),
  dailySendLimit: integer("dailySendLimit").default(50).notNull(),
  emailDelayMs: integer("emailDelayMs").default(5000).notNull(),
  smtpUser: text("smtpUser"),
  smtpPass: text("smtpPass"),
  smtpHost: text("smtpHost"),
  smtpPort: integer("smtpPort"),
  smtpSecure: integer("smtpSecure", { mode: "boolean" }),
  gmailSettings: text("gmailSettings"),
  googleSheetsConfig: text("googleSheetsConfig"),
  theme: text("theme").default("system").notNull(),
  createdAt: text("createdAt").$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").$defaultFn(() => new Date().toISOString()).notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export const emailQueue = sqliteTable("emailQueue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  applicationId: integer("applicationId"),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").default("pending").notNull(),
  scheduledAt: text("scheduledAt"),
  sentAt: text("sentAt"),
  failureReason: text("failureReason"),
  createdAt: text("createdAt").$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").$defaultFn(() => new Date().toISOString()).notNull(),
});

export type EmailQueue = typeof emailQueue.$inferSelect;
export type InsertEmailQueue = typeof emailQueue.$inferInsert;

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
