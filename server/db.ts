import { eq, and, desc } from "drizzle-orm";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { InsertUser, users, companies, applications, emailTemplates, resumes, activityLogs, userSettings, emailQueue, type Company, type Application, type EmailTemplate, type Resume, type ActivityLog, type UserSettings, type EmailQueue } from "../drizzle/schema";

// Companies queries
export async function getCompaniesByUserId(db: DrizzleD1Database, userId: number) {
  return db.select().from(companies).where(eq(companies.userId, userId)).orderBy(desc(companies.updatedAt));
}

export async function getCompanyById(db: DrizzleD1Database, id: number, userId: number) {
  const result = await db.select().from(companies).where(and(eq(companies.id, id), eq(companies.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCompany(db: DrizzleD1Database, data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) {
  return db.insert(companies).values(data);
}

export async function updateCompany(db: DrizzleD1Database, id: number, userId: number, data: Partial<Omit<Company, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  return db.update(companies).set(data).where(and(eq(companies.id, id), eq(companies.userId, userId)));
}

export async function deleteCompany(db: DrizzleD1Database, id: number, userId: number) {
  return db.delete(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)));
}

// Applications queries
export async function getApplicationsByUserId(db: DrizzleD1Database, userId: number, limit?: number, offset?: number) {
  let query: any = db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
  if (limit) query = query.limit(limit);
  if (offset) query = query.offset(offset);
  return query;
}

export async function getApplicationById(db: DrizzleD1Database, id: number, userId: number) {
  const result = await db.select().from(applications).where(and(eq(applications.id, id), eq(applications.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createApplication(db: DrizzleD1Database, data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) {
  return db.insert(applications).values(data);
}

export async function updateApplication(db: DrizzleD1Database, id: number, userId: number, data: Partial<Omit<Application, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  return db.update(applications).set(data).where(and(eq(applications.id, id), eq(applications.userId, userId)));
}

export async function deleteApplication(db: DrizzleD1Database, id: number, userId: number) {
  return db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, userId)));
}

export async function getApplicationsByCompanyId(db: DrizzleD1Database, companyId: number, userId: number) {
  return db.select().from(applications).where(and(eq(applications.companyId, companyId), eq(applications.userId, userId))).orderBy(desc(applications.createdAt));
}

// Email Templates queries
export async function getTemplatesByUserId(db: DrizzleD1Database, userId: number) {
  return db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId)).orderBy(desc(emailTemplates.updatedAt));
}

export async function getTemplateById(db: DrizzleD1Database, id: number, userId: number) {
  const result = await db.select().from(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTemplate(db: DrizzleD1Database, data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
  return db.insert(emailTemplates).values(data);
}

export async function updateTemplate(db: DrizzleD1Database, id: number, userId: number, data: Partial<Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  return db.update(emailTemplates).set(data).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

export async function deleteTemplate(db: DrizzleD1Database, id: number, userId: number) {
  return db.delete(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

// Resumes queries
export async function getResumesByUserId(db: DrizzleD1Database, userId: number) {
  return db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.uploadedAt));
}

export async function getResumeById(db: DrizzleD1Database, id: number, userId: number) {
  const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDefaultResume(db: DrizzleD1Database, userId: number) {
  const result = await db.select().from(resumes).where(and(eq(resumes.userId, userId), eq(resumes.isDefault, true))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createResume(db: DrizzleD1Database, data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) {
  return db.insert(resumes).values(data);
}

export async function updateResume(db: DrizzleD1Database, id: number, userId: number, data: Partial<Omit<Resume, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  return db.update(resumes).set(data).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
}

export async function deleteResume(db: DrizzleD1Database, id: number, userId: number) {
  return db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
}

// Activity Logs queries
export async function getActivityLogsByUserId(db: DrizzleD1Database, userId: number, limit: number = 50, offset: number = 0) {
  return db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset);
}

export async function createActivityLog(db: DrizzleD1Database, data: Omit<ActivityLog, 'id' | 'createdAt'>) {
  return db.insert(activityLogs).values(data);
}

// User Settings queries
export async function getUserSettings(db: DrizzleD1Database, userId: number) {
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserSettings(db: DrizzleD1Database, data: Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>) {
  return db.insert(userSettings).values(data);
}

export async function updateUserSettings(db: DrizzleD1Database, userId: number, data: Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  return db.update(userSettings).set(data).where(eq(userSettings.userId, userId));
}

// Dashboard stats queries
export async function getDashboardStats(db: DrizzleD1Database, userId: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);

  const allApps = await db.select().from(applications).where(eq(applications.userId, userId));
  const todayApps = allApps.filter(a => new Date(a.createdAt) >= today);
  const weekApps = allApps.filter(a => new Date(a.createdAt) >= weekAgo);
  const monthApps = allApps.filter(a => new Date(a.createdAt) >= monthAgo);

  return {
    totalApplications: allApps.length,
    todayApplications: todayApps.length,
    weekApplications: weekApps.length,
    monthApplications: monthApps.length,
    replies: allApps.filter(a => a.status === 'replied').length,
    interviews: allApps.filter(a => a.status === 'interview').length,
    rejected: allApps.filter(a => a.status === 'rejected').length,
    pending: allApps.filter(a => a.status === 'sent' || a.status === 'draft').length,
    responseRate: allApps.length > 0 ? ((allApps.filter(a => a.status === 'replied' || a.status === 'interview').length / allApps.length) * 100).toFixed(1) : '0',
  };
}
