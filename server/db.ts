import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  conversations, 
  messages, 
  userSettings, 
  providerConfigs, 
  voiceProfiles,
  usageStats,
  InsertConversation,
  InsertMessage,
  InsertUserSettings,
  InsertProviderConfig,
  InsertVoiceProfile,
  InsertUsageStats
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ============ User Management ============

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

// ============ Conversation Management ============

export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversations).values(data);
  return result[0].insertId;
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.isArchived, false)))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateConversation(id: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Archive instead of delete
  await db.update(conversations).set({ isArchived: true }).where(eq(conversations.id, id));
}

// ============ Message Management ============

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(data);
  
  // Update conversation's lastMessageAt
  await db.update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, data.conversationId));
  
  return result[0].insertId;
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

export async function deleteMessage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(messages).where(eq(messages.id, id));
}

// ============ User Settings ============

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  
  // Create default settings if none exist
  if (result.length === 0) {
    await db.insert(userSettings).values({ userId });
    const newResult = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    return newResult[0];
  }
  
  return result[0];
}

export async function updateUserSettings(userId: number, data: Partial<InsertUserSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(userSettings).set(data).where(eq(userSettings.userId, userId));
}

// ============ Provider Configurations ============

export async function getUserProviderConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(providerConfigs)
    .where(eq(providerConfigs.userId, userId));
}

export async function createProviderConfig(data: InsertProviderConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(providerConfigs).values(data);
  return result[0].insertId;
}

export async function updateProviderConfig(id: number, data: Partial<InsertProviderConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(providerConfigs).set(data).where(eq(providerConfigs.id, id));
}

export async function deleteProviderConfig(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(providerConfigs).where(eq(providerConfigs.id, id));
}

// ============ Voice Profiles ============

export async function getUserVoiceProfiles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(voiceProfiles)
    .where(eq(voiceProfiles.userId, userId))
    .orderBy(desc(voiceProfiles.isDefault));
}

export async function createVoiceProfile(data: InsertVoiceProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await db.update(voiceProfiles)
      .set({ isDefault: false })
      .where(eq(voiceProfiles.userId, data.userId));
  }
  
  const result = await db.insert(voiceProfiles).values(data);
  return result[0].insertId;
}

export async function deleteVoiceProfile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(voiceProfiles).where(eq(voiceProfiles.id, id));
}

// ============ Usage Stats ============

export async function trackUsage(data: InsertUsageStats) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(usageStats).values(data);
}

export async function getUserUsageStats(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(usageStats).where(eq(usageStats.userId, userId));
  
  // Add date filters if provided
  // For simplicity, returning all stats for now
  
  return query.orderBy(desc(usageStats.date));
}
