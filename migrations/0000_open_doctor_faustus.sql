CREATE TABLE `activityLogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`actionType` text NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`companyId` integer NOT NULL,
	`hrEmail` text NOT NULL,
	`subject` text NOT NULL,
	`emailBody` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`resumeUsed` text,
	`templateUsed` text,
	`notes` text,
	`sentAt` text,
	`repliedAt` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`emails` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`firstAppliedAt` text,
	`lastAppliedAt` text,
	`applicationCount` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `emailQueue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`applicationId` integer,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`scheduledAt` text,
	`sentAt` text,
	`failureReason` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`category` text,
	`variables` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`filename` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`fileSize` integer,
	`mimeType` text,
	`uploadedAt` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`phone` text,
	`portfolio` text,
	`github` text,
	`linkedin` text,
	`signature` text,
	`defaultResumeId` integer,
	`defaultSubject` text,
	`dailySendLimit` integer DEFAULT 50 NOT NULL,
	`emailDelayMs` integer DEFAULT 5000 NOT NULL,
	`gmailSettings` text,
	`googleSheetsConfig` text,
	`theme` text DEFAULT 'system' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `userSettings_userId_unique` ON `userSettings` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`lastSignedIn` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);