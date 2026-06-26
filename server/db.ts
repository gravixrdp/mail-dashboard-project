import { eq, and, desc, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, companies, applications, emailTemplates, resumes, activityLogs, userSettings, emailQueue, type Company, type Application, type EmailTemplate, type Resume, type ActivityLog, type UserSettings, type EmailQueue } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Companies queries
export async function getCompaniesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.userId, userId)).orderBy(desc(companies.updatedAt));
}

export async function getCompanyById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(and(eq(companies.id, id), eq(companies.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companies).values(data);
  return result;
}

export async function updateCompany(id: number, userId: number, data: Partial<Omit<Company, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(companies).set(data).where(and(eq(companies.id, id), eq(companies.userId, userId)));
}

export async function deleteCompany(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)));
}

// Applications queries
export async function getApplicationsByUserId(userId: number, limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
  if (limit) query = query.limit(limit);
  if (offset) query = query.offset(offset);
  return query;
}

export async function getApplicationById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(applications).where(and(eq(applications.id, id), eq(applications.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createApplication(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(applications).values(data);
}

export async function updateApplication(id: number, userId: number, data: Partial<Omit<Application, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(applications).set(data).where(and(eq(applications.id, id), eq(applications.userId, userId)));
}

export async function deleteApplication(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, userId)));
}

export async function getApplicationsByCompanyId(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applications).where(and(eq(applications.companyId, companyId), eq(applications.userId, userId))).orderBy(desc(applications.createdAt));
}

// Email Templates queries
export async function getTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId)).orderBy(desc(emailTemplates.updatedAt));
}

export async function getTemplateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(emailTemplates).values(data);
}

export async function updateTemplate(id: number, userId: number, data: Partial<Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(emailTemplates).set(data).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

export async function deleteTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

// Resumes queries
export async function getResumesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.uploadedAt));
}

export async function getResumeById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDefaultResume(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resumes).where(and(eq(resumes.userId, userId), eq(resumes.isDefault, true))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createResume(data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(resumes).values(data);
}

export async function updateResume(id: number, userId: number, data: Partial<Omit<Resume, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(resumes).set(data).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
}

export async function deleteResume(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
}

// Activity Logs queries
export async function getActivityLogsByUserId(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset);
}

export async function createActivityLog(data: Omit<ActivityLog, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(activityLogs).values(data);
}

// User Settings queries
export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserSettings(data: Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(userSettings).values(data);
}

export async function updateUserSettings(userId: number, data: Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(userSettings).set(data).where(eq(userSettings.userId, userId));
}

// Email Queue queries
export async function getEmailQueueByUserId(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(emailQueue).where(eq(emailQueue.userId, userId));
  if (status) query = query.where(eq(emailQueue.status, status as any));
  return query.orderBy(desc(emailQueue.createdAt));
}

export async function createEmailQueue(data: Omit<EmailQueue, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(emailQueue).values(data);
}

export async function updateEmailQueue(id: number, userId: number, data: Partial<Omit<EmailQueue, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(emailQueue).set(data).where(and(eq(emailQueue.id, id), eq(emailQueue.userId, userId)));
}

// Dashboard stats queries
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);

  const allApps = await db.select().from(applications).where(eq(applications.userId, userId));
  const todayApps = allApps.filter(a => a.createdAt >= today);
  const weekApps = allApps.filter(a => a.createdAt >= weekAgo);
  const monthApps = allApps.filter(a => a.createdAt >= monthAgo);

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
