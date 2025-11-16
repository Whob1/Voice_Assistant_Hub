ALTER TABLE `userSettings` MODIFY COLUMN `defaultTtsProvider` varchar(64) DEFAULT 'elevenlabs';--> statement-breakpoint
ALTER TABLE `userSettings` MODIFY COLUMN `defaultTtsVoice` varchar(128) DEFAULT 'ZF6FPAbjXT4488VcRRnw';--> statement-breakpoint
ALTER TABLE `conversations` ADD `systemPrompt` text;--> statement-breakpoint
ALTER TABLE `conversations` ADD `llmProvider` varchar(64) DEFAULT 'openai';--> statement-breakpoint
ALTER TABLE `conversations` ADD `llmModel` varchar(128) DEFAULT 'gpt-4';--> statement-breakpoint
ALTER TABLE `conversations` ADD `temperature` int DEFAULT 70;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `defaultSttProvider` varchar(64) DEFAULT 'whisper';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `defaultSttModel` varchar(64) DEFAULT 'whisper-1';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `defaultTtsModel` varchar(64) DEFAULT 'eleven_turbo_v2_5';--> statement-breakpoint
ALTER TABLE `userSettings` DROP COLUMN `defaultVoiceProvider`;