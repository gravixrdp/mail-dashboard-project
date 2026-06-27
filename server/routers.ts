import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { sendEmail } from "./emailService";

// Validation schemas
const companySchema = z.object({
  name: z.string().min(1),
  emails: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(["active", "archived", "rejected"]).optional(),
});

const applicationSchema = z.object({
  companyId: z.number(),
  hrEmail: z.string().email(),
  subject: z.string().min(1),
  emailBody: z.string().min(1),
  status: z.enum(["sent", "replied", "interview", "rejected", "ghosted", "draft"]).optional(),
  resumeUsed: z.string().optional(),
  templateUsed: z.string().optional(),
  notes: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  category: z.string().optional(),
  variables: z.string().optional(),
});

const userSettingsSchema = z.object({
  phone: z.string().optional(),
  portfolio: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  signature: z.string().optional(),
  defaultResumeId: z.number().optional(),
  defaultSubject: z.string().optional(),
  dailySendLimit: z.number().optional(),
  emailDelayMs: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpSecure: z.boolean().optional(),
  googleSheetsConfig: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      // Note: For Cloudflare Workers, we might handle cookies differently, but for now, let's just return success
      return {
        success: true,
      } as const;
    }),
  }),

  // Companies router
  companies: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getCompaniesByUserId(ctx.db, ctx.user.id)
    ),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getCompanyById(ctx.db, input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(companySchema).mutation(({ ctx, input }) =>
      db.createCompany(ctx.db, {
        userId: ctx.user.id,
        name: input.name,
        emails: input.emails,
        notes: input.notes || null,
        status: input.status || "active",
        applicationCount: 0,
        firstAppliedAt: null,
        lastAppliedAt: null,
      })
    ),
    update: protectedProcedure.input(z.object({ id: z.number(), data: companySchema.partial() })).mutation(({ ctx, input }) =>
      db.updateCompany(ctx.db, input.id, ctx.user.id, input.data)
    ),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      db.deleteCompany(ctx.db, input.id, ctx.user.id)
    ),
  }),

  // Applications router
  applications: router({
    list: protectedProcedure.input(z.object({ limit: z.number().optional(), offset: z.number().optional() })).query(({ ctx, input }) =>
      db.getApplicationsByUserId(ctx.db, ctx.user.id, input.limit, input.offset)
    ),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getApplicationById(ctx.db, input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(applicationSchema).mutation(async ({ ctx, input }) => {
      // Get user settings for SMTP
      const settings = await db.getUserSettings(ctx.db, ctx.user.id);
      
      let sentAt = null;
      
      if (input.status === "sent") {
        // Use the new individual SMTP fields
        const smtpSettings = {
          user: settings?.smtpUser,
          pass: settings?.smtpPass,
          host: settings?.smtpHost,
          port: settings?.smtpPort,
          secure: settings?.smtpSecure,
        };
        
        // Get resume if one is selected
        const attachments = [];
        // First check if a specific resume is selected
        if (input.resumeUsed) {
          const resumeId = parseInt(input.resumeUsed);
          if (resumeId) {
            const resume = await db.getResumeById(ctx.db, resumeId, ctx.user.id);
            if (resume?.fileUrl) {
              attachments.push({
                filename: resume.filename,
                path: resume.fileUrl,
                contentType: resume.mimeType || 'application/pdf',
              });
            }
          }
        } 
        // If no specific resume, check default resume
        else if (settings?.defaultResumeId) {
          const defaultResume = await db.getDefaultResume(ctx.db, ctx.user.id);
          if (defaultResume?.fileUrl) {
            attachments.push({
              filename: defaultResume.filename,
              path: defaultResume.fileUrl,
              contentType: defaultResume.mimeType || 'application/pdf',
            });
          }
        }
        
        // Send the email with HTML and attachments
        await sendEmail(smtpSettings, {
          to: input.hrEmail,
          subject: input.subject,
          text: input.emailBody,
          html: input.emailBody, // Pass the email body as HTML so bold etc works!
          attachments,
        });
        
        sentAt = new Date().toISOString();
      }

      const result = await db.createApplication(ctx.db, {
        userId: ctx.user.id,
        companyId: input.companyId,
        hrEmail: input.hrEmail,
        subject: input.subject,
        emailBody: input.emailBody,
        status: input.status || "draft",
        resumeUsed: input.resumeUsed || null,
        templateUsed: input.templateUsed || null,
        notes: input.notes || null,
        sentAt,
        repliedAt: null,
      });
      
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: input.status === "sent" ? "APPLICATION_SENT" : "APPLICATION_CREATED",
        description: input.status === "sent" 
          ? `Application sent to ${input.hrEmail}` 
          : `Application created for ${input.hrEmail}`,
        metadata: JSON.stringify({ companyId: input.companyId, email: input.hrEmail }),
      });
      
      return result;
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: applicationSchema.partial() })).mutation(async ({ ctx, input }) => {
      const result = await db.updateApplication(ctx.db, input.id, ctx.user.id, input.data);
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: "APPLICATION_UPDATED",
        description: `Application ${input.id} updated`,
        metadata: JSON.stringify({ applicationId: input.id }),
      });
      return result;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const result = await db.deleteApplication(ctx.db, input.id, ctx.user.id);
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: "APPLICATION_DELETED",
        description: `Application ${input.id} deleted`,
        metadata: JSON.stringify({ applicationId: input.id }),
      });
      return result;
    }),
    getByCompany: protectedProcedure.input(z.object({ companyId: z.number() })).query(({ ctx, input }) =>
      db.getApplicationsByCompanyId(ctx.db, input.companyId, ctx.user.id)
    ),
  }),

  // Email Templates router
  templates: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getTemplatesByUserId(ctx.db, ctx.user.id)
    ),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getTemplateById(ctx.db, input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(templateSchema).mutation(async ({ ctx, input }) => {
      const result = await db.createTemplate(ctx.db, {
        userId: ctx.user.id,
        name: input.name,
        subject: input.subject,
        body: input.body,
        category: input.category || null,
        variables: input.variables || null,
      });
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: "TEMPLATE_CREATED",
        description: `Template "${input.name}" created`,
        metadata: JSON.stringify({ templateName: input.name }),
      });
      return result;
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), data: templateSchema.partial() })).mutation(async ({ ctx, input }) => {
      const result = await db.updateTemplate(ctx.db, input.id, ctx.user.id, input.data);
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: "TEMPLATE_UPDATED",
        description: `Template ${input.id} updated`,
        metadata: JSON.stringify({ templateId: input.id }),
      });
      return result;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const result = await db.deleteTemplate(ctx.db, input.id, ctx.user.id);
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: "TEMPLATE_DELETED",
        description: `Template ${input.id} deleted`,
        metadata: JSON.stringify({ templateId: input.id }),
      });
      return result;
    }),
  }),

  // Resumes router
  resumes: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getResumesByUserId(ctx.db, ctx.user.id)
    ),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getResumeById(ctx.db, input.id, ctx.user.id)
    ),
    getDefault: protectedProcedure.query(({ ctx }) =>
      db.getDefaultResume(ctx.db, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      filename: z.string(),
      fileKey: z.string(),
      fileUrl: z.string(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      isDefault: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createResume(ctx.db, {
        userId: ctx.user.id,
        filename: input.filename,
        fileKey: input.fileKey,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize || null,
        mimeType: input.mimeType || null,
        isDefault: input.isDefault || false,
        uploadedAt: new Date().toISOString(),
      });
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: "RESUME_UPLOADED",
        description: `Resume "${input.filename}" uploaded`,
        metadata: JSON.stringify({ filename: input.filename }),
      });
      return result;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        filename: z.string().optional(),
        isDefault: z.boolean().optional(),
      }),
    })).mutation(async ({ ctx, input }) => {
      if (input.data.isDefault) {
        const allResumes = await db.getResumesByUserId(ctx.db, ctx.user.id);
        for (const resume of allResumes) {
          if (resume.id !== input.id && resume.isDefault) {
            await db.updateResume(ctx.db, resume.id, ctx.user.id, { isDefault: false });
          }
        }
      }
      const result = await db.updateResume(ctx.db, input.id, ctx.user.id, input.data);
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: "RESUME_UPDATED",
        description: `Resume ${input.id} updated`,
        metadata: JSON.stringify({ resumeId: input.id }),
      });
      return result;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const result = await db.deleteResume(ctx.db, input.id, ctx.user.id);
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: "RESUME_DELETED",
        description: `Resume ${input.id} deleted`,
        metadata: JSON.stringify({ resumeId: input.id }),
      });
      return result;
    }),
  }),

  // Activity Logs router
  activityLogs: router({
    list: protectedProcedure.input(z.object({ limit: z.number().optional(), offset: z.number().optional() })).query(({ ctx, input }) =>
      db.getActivityLogsByUserId(ctx.db, ctx.user.id, input.limit || 50, input.offset || 0)
    ),
  }),

  // User Settings router
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      let settings = await db.getUserSettings(ctx.db, ctx.user.id);
      if (!settings) {
        await db.createUserSettings(ctx.db, {
          userId: ctx.user.id,
          theme: "system",
          dailySendLimit: 50,
          emailDelayMs: 5000,
          phone: null,
          portfolio: null,
          github: null,
          linkedin: null,
          signature: null,
          defaultResumeId: null,
          defaultSubject: null,
          gmailSettings: null,
          googleSheetsConfig: null,
        });
        settings = await db.getUserSettings(ctx.db, ctx.user.id);
      }
      return settings;
    }),
    update: protectedProcedure.input(userSettingsSchema).mutation(async ({ ctx, input }) => {
      const cleanInput = Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined)
      ) as Partial<typeof input>;
      const result = await db.updateUserSettings(ctx.db, ctx.user.id, cleanInput);
      await db.createActivityLog(ctx.db, {
        userId: ctx.user.id,
        actionType: "SETTINGS_UPDATED",
        description: "User settings updated",
        metadata: JSON.stringify({}),
      });
      return result;
    }),
  }),

  // Dashboard router
  dashboard: router({
    stats: protectedProcedure.query(({ ctx }) =>
      db.getDashboardStats(ctx.db, ctx.user.id)
    ),
    weeklyData: protectedProcedure.query(({ ctx }) =>
      db.getWeeklyData(ctx.db, ctx.user.id)
    ),
    monthlyData: protectedProcedure.query(({ ctx }) =>
      db.getMonthlyData(ctx.db, ctx.user.id)
    ),
    dailyData: protectedProcedure.query(({ ctx }) =>
      db.getDailyData(ctx.db, ctx.user.id)
    ),
    topDomains: protectedProcedure.query(({ ctx }) =>
      db.getTopDomains(ctx.db, ctx.user.id)
    ),
  }),
});

export type AppRouter = typeof appRouter;
