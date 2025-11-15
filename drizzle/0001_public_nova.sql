CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastMessageAt` timestamp,
	`isArchived` boolean NOT NULL DEFAULT false,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`audioUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`tokenCount` int,
	`provider` varchar(64),
	`model` varchar(128),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providerConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`apiKey` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providerConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usageStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`provider` varchar(64) NOT NULL,
	`requestType` enum('text','voice','tts','image') NOT NULL,
	`tokenCount` int,
	`audioSeconds` int,
	`requestCount` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usageStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultTextProvider` varchar(64) DEFAULT 'openai',
	`defaultTextModel` varchar(128) DEFAULT 'gpt-4',
	`defaultVoiceProvider` varchar(64) DEFAULT 'openai',
	`defaultTtsProvider` varchar(64) DEFAULT 'openai',
	`defaultTtsVoice` varchar(64) DEFAULT 'alloy',
	`silenceThreshold` int DEFAULT 1500,
	`vadSensitivity` int DEFAULT 70,
	`ttsSpeed` int DEFAULT 100,
	`autoPlayResponses` boolean DEFAULT true,
	`theme` varchar(32) DEFAULT 'dark',
	`language` varchar(10) DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `voiceProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`voiceId` varchar(128) NOT NULL,
	`sampleUrl` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voiceProfiles_id` PRIMARY KEY(`id`)
);
