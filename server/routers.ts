import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ Conversation Management ============
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createConversation({
          userId: ctx.user.id,
          title: input.title,
        });
        return { id };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.id);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return conversation;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.id);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.updateConversation(input.id, { title: input.title });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.id);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.deleteConversation(input.id);
        return { success: true };
      }),
  }),

  // ============ Message Management ============
  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.getConversationMessages(input.conversationId);
      }),

    create: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        audioUrl: z.string().optional(),
        provider: z.string().optional(),
        model: z.string().optional(),
        tokenCount: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const id = await db.createMessage(input);
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteMessage(input.id);
        return { success: true };
      }),
  }),

  // ============ AI Chat ============
  chat: router({
    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string(),
        provider: z.string().optional(),
        model: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Get conversation history
        const history = await db.getConversationMessages(input.conversationId);
        
        // Save user message
        await db.createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.message,
        });

        // Build messages for AI
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: "You are a helpful AI assistant with voice capabilities. Provide clear, concise, and helpful responses." },
          ...history.map(m => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          })),
          { role: "user", content: input.message },
        ];

        // Call AI
        const response = await invokeLLM({ messages });
        const messageContent = response.choices[0]?.message?.content;
        const assistantMessage = typeof messageContent === 'string' 
          ? messageContent 
          : "I apologize, but I couldn't generate a response.";

        // Save assistant message
        const messageId = await db.createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: assistantMessage,
          provider: input.provider || "openai",
          model: input.model || "gpt-4",
          tokenCount: response.usage?.total_tokens,
        });

        // Track usage
        await db.trackUsage({
          userId: ctx.user.id,
          date: new Date(),
          provider: input.provider || "openai",
          requestType: "text",
          tokenCount: response.usage?.total_tokens || 0,
        });

        return {
          messageId,
          content: assistantMessage,
          tokenCount: response.usage?.total_tokens,
        };
      }),
  }),

  // ============ Voice Features ============
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
        });

        // Check if transcription was successful
        if ('error' in result) {
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: result.error 
          });
        }

        // Track usage
        await db.trackUsage({
          userId: ctx.user.id,
          date: new Date(),
          provider: "openai",
          requestType: "voice",
          audioSeconds: Math.ceil((result.duration || 0)),
        });

        return {
          text: result.text,
          language: result.language,
          duration: result.duration,
        };
      }),

    uploadAudio: protectedProcedure
      .input(z.object({
        audioData: z.string(), // base64 encoded
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64
        const buffer = Buffer.from(input.audioData, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `${ctx.user.id}/audio/${timestamp}-${randomSuffix}-${input.fileName}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return { url, fileKey };
      }),
  }),

  // ============ User Settings ============
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        defaultTextProvider: z.string().optional(),
        defaultTextModel: z.string().optional(),
        defaultVoiceProvider: z.string().optional(),
        defaultTtsProvider: z.string().optional(),
        defaultTtsVoice: z.string().optional(),
        silenceThreshold: z.number().optional(),
        vadSensitivity: z.number().optional(),
        ttsSpeed: z.number().optional(),
        autoPlayResponses: z.boolean().optional(),
        theme: z.string().optional(),
        language: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ============ Provider Configurations ============
  providers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProviderConfigs(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        provider: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createProviderConfig({
          userId: ctx.user.id,
          provider: input.provider,
          apiKey: input.apiKey,
          isActive: true,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        apiKey: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateProviderConfig(input.id, {
          apiKey: input.apiKey,
          isActive: input.isActive,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteProviderConfig(input.id);
        return { success: true };
      }),
  }),

  // ============ Voice Profiles ============
  voiceProfiles: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserVoiceProfiles(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        provider: z.string(),
        voiceId: z.string(),
        sampleUrl: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createVoiceProfile({
          userId: ctx.user.id,
          ...input,
        });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteVoiceProfile(input.id);
        return { success: true };
      }),
  }),

  // ============ Usage Stats ============
  usage: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserUsageStats(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
