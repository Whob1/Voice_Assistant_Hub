import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

/**
 * Conversations/threads for organizing chat sessions
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  systemPrompt: text("systemPrompt"), // Custom system prompt for this conversation
  llmProvider: varchar("llmProvider", { length: 64 }).default("openai"), // AI provider
  llmModel: varchar("llmModel", { length: 128 }).default("gpt-4"), // AI model
  temperature: int("temperature").default(70), // Temperature * 100 (0-200)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  isArchived: boolean("isArchived").default(false).notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages within conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  audioUrl: text("audioUrl"), // For voice messages
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  tokenCount: int("tokenCount"),
  provider: varchar("provider", { length: 64 }), // Which AI provider was used
  model: varchar("model", { length: 128 }), // Which model was used
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * User settings and preferences
 */
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // AI Provider preferences
  defaultTextProvider: varchar("defaultTextProvider", { length: 64 }).default("openai"),
  defaultTextModel: varchar("defaultTextModel", { length: 128 }).default("gpt-4"),
  defaultSttProvider: varchar("defaultSttProvider", { length: 64 }).default("whisper"),
  defaultSttModel: varchar("defaultSttModel", { length: 64 }).default("whisper-1"),
  defaultTtsProvider: varchar("defaultTtsProvider", { length: 64 }).default("elevenlabs"),
  defaultTtsVoice: varchar("defaultTtsVoice", { length: 128 }).default("ZF6FPAbjXT4488VcRRnw"),
  defaultTtsModel: varchar("defaultTtsModel", { length: 64 }).default("eleven_turbo_v2_5"),
  // Voice settings
  silenceThreshold: int("silenceThreshold").default(1500), // ms
  vadSensitivity: int("vadSensitivity").default(70), // 0-100
  ttsSpeed: int("ttsSpeed").default(100), // percentage
  autoPlayResponses: boolean("autoPlayResponses").default(true),
  // UI preferences
  theme: varchar("theme", { length: 32 }).default("dark"),
  language: varchar("language", { length: 10 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * API keys and provider configurations (encrypted)
 */
export const providerConfigs = mysqlTable("providerConfigs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  apiKey: text("apiKey").notNull(), // Should be encrypted in production
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderConfig = typeof providerConfigs.$inferSelect;
export type InsertProviderConfig = typeof providerConfigs.$inferInsert;

/**
 * Voice profiles for custom TTS voices
 */
export const voiceProfiles = mysqlTable("voiceProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  voiceId: varchar("voiceId", { length: 128 }).notNull(),
  sampleUrl: text("sampleUrl"), // Audio sample for reference
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceProfile = typeof voiceProfiles.$inferSelect;
export type InsertVoiceProfile = typeof voiceProfiles.$inferInsert;

/**
 * Usage tracking for analytics and cost management
 */
export const usageStats = mysqlTable("usageStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  requestType: mysqlEnum("requestType", ["text", "voice", "tts", "image"]).notNull(),
  tokenCount: int("tokenCount"),
  audioSeconds: int("audioSeconds"),
  requestCount: int("requestCount").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageStats = typeof usageStats.$inferSelect;
export type InsertUsageStats = typeof usageStats.$inferInsert;
