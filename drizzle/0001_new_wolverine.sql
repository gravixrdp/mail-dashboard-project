CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int NOT NULL,
	`hrEmail` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`emailBody` text NOT NULL,
	`status` enum('sent','replied','interview','rejected','ghosted','draft') NOT NULL DEFAULT 'draft',
	`resumeUsed` varchar(255),
	`templateUsed` varchar(255),
	`notes` text,
	`sentAt` timestamp,
	`repliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`emails` text NOT NULL,
	`notes` text,
	`status` enum('active','archived','rejected') NOT NULL DEFAULT 'active',
	`firstAppliedAt` timestamp,
	`lastAppliedAt` timestamp,
	`applicationCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`applicationId` int,
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(100),
	`variables` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`fileSize` int,
	`mimeType` varchar(100),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(20),
	`portfolio` text,
	`github` text,
	`linkedin` text,
	`signature` text,
	`defaultResumeId` int,
	`defaultSubject` text,
	`dailySendLimit` int NOT NULL DEFAULT 50,
	`emailDelayMs` int NOT NULL DEFAULT 5000,
	`gmailSettings` text,
	`googleSheetsConfig` text,
	`theme` enum('light','dark','system') NOT NULL DEFAULT 'system',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `activityLogs_userId_idx` ON `activityLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `activityLogs_actionType_idx` ON `activityLogs` (`actionType`);--> statement-breakpoint
CREATE INDEX `applications_userId_idx` ON `applications` (`userId`);--> statement-breakpoint
CREATE INDEX `applications_companyId_idx` ON `applications` (`companyId`);--> statement-breakpoint
CREATE INDEX `applications_status_idx` ON `applications` (`status`);--> statement-breakpoint
CREATE INDEX `companies_userId_idx` ON `companies` (`userId`);--> statement-breakpoint
CREATE INDEX `emailQueue_userId_idx` ON `emailQueue` (`userId`);--> statement-breakpoint
CREATE INDEX `emailQueue_status_idx` ON `emailQueue` (`status`);--> statement-breakpoint
CREATE INDEX `emailQueue_scheduledAt_idx` ON `emailQueue` (`scheduledAt`);--> statement-breakpoint
CREATE INDEX `emailTemplates_userId_idx` ON `emailTemplates` (`userId`);--> statement-breakpoint
CREATE INDEX `resumes_userId_idx` ON `resumes` (`userId`);--> statement-breakpoint
CREATE INDEX `resumes_isDefault_idx` ON `resumes` (`isDefault`);--> statement-breakpoint
CREATE INDEX `userSettings_userId_idx` ON `userSettings` (`userId`);