import { invokeLLM } from "../_core/llm";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  provider?: string;
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  provider?: string;
}

/**
 * Call OpenAI models
 */
async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
  const response = await invokeLLM({
    messages: request.messages,
  });

  return {
    content: typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content
      : "No response generated",
    usage: response.usage,
    model: response.model,
    provider: "openai",
  };
}

/**
 * Call OpenRouter models (supports many providers)
 */
async function callOpenRouter(request: LLMRequest): Promise<LLMResponse> {
  if (!request.apiKey) {
    throw new Error("OpenRouter API key is required");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${request.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.VITE_APP_ID || "https://ai-voice-assistant.manus.space",
    },
    body: JSON.stringify({
      model: request.model || "mistralai/mistral-7b-instruct",
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || "No response generated",
    usage: data.usage,
    model: data.model,
    provider: "openrouter",
  };
}

/**
 * Call Mistral AI models
 */
async function callMistral(request: LLMRequest): Promise<LLMResponse> {
  if (!request.apiKey) {
    throw new Error("Mistral API key is required");
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${request.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: request.model || "mistral-small-latest",
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || "No response generated",
    usage: data.usage,
    model: data.model,
    provider: "mistral",
  };
}

/**
 * Call Anthropic Claude models
 */
async function callAnthropic(request: LLMRequest): Promise<LLMResponse> {
  if (!request.apiKey) {
    throw new Error("Anthropic API key is required");
  }

  // Separate system message from conversation
  const systemMessage = request.messages.find(m => m.role === "system");
  const conversationMessages = request.messages.filter(m => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": request.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: request.model || "claude-3-5-sonnet-20241022",
      system: systemMessage?.content || "",
      messages: conversationMessages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content[0]?.text || "No response generated",
    usage: {
      prompt_tokens: data.usage?.input_tokens || 0,
      completion_tokens: data.usage?.output_tokens || 0,
      total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
    model: data.model,
    provider: "anthropic",
  };
}

/**
 * Main function to call any LLM provider
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const provider = request.provider || "openai";

  switch (provider.toLowerCase()) {
    case "openai":
      return callOpenAI(request);
    
    case "openrouter":
      return callOpenRouter(request);
    
    case "mistral":
      return callMistral(request);
    
    case "anthropic":
    case "claude":
      return callAnthropic(request);
    
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: string): string[] {
  switch (provider.toLowerCase()) {
    case "openai":
      return [
        "gpt-4",
        "gpt-4-turbo",
        "gpt-4o",
        "gpt-3.5-turbo",
      ];
    
    case "openrouter":
      return [
        "mistralai/mistral-7b-instruct",
        "mistralai/mistral-medium",
        "mistralai/mistral-large-latest",
        "anthropic/claude-3-opus",
        "anthropic/claude-3-5-sonnet",
        "google/gemini-pro",
        "meta-llama/llama-3-70b-instruct",
        "openai/gpt-4-turbo",
      ];
    
    case "mistral":
      return [
        "mistral-small-latest",
        "mistral-medium-latest",
        "mistral-large-latest",
        "open-mistral-7b",
        "open-mixtral-8x7b",
      ];
    
    case "anthropic":
    case "claude":
      return [
        "claude-3-5-sonnet-20241022",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
      ];
    
    default:
      return [];
  }
}

/**
 * Get provider display name
 */
export function getProviderName(provider: string): string {
  const names: Record<string, string> = {
    openai: "OpenAI",
    openrouter: "OpenRouter",
    mistral: "Mistral AI",
    anthropic: "Anthropic Claude",
    claude: "Anthropic Claude",
  };
  return names[provider.toLowerCase()] || provider;
}
