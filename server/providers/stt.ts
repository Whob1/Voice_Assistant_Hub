import { transcribeAudio } from "../_core/voiceTranscription";

export interface STTRequest {
  audioUrl: string;
  provider?: string;
  language?: string;
  apiKey?: string;
  model?: string;
}

export interface STTResponse {
  text: string;
  language?: string;
  duration?: number;
  provider: string;
  confidence?: number;
}

/**
 * Call OpenAI Whisper (built-in)
 */
async function callWhisper(request: STTRequest): Promise<STTResponse> {
  const result = await transcribeAudio({
    audioUrl: request.audioUrl,
    language: request.language,
  });

  if ('error' in result) {
    throw new Error(result.error);
  }

  return {
    text: result.text,
    language: result.language,
    duration: result.duration,
    provider: "whisper",
  };
}

/**
 * Call Deepgram Nova-2
 */
async function callDeepgram(request: STTRequest): Promise<STTResponse> {
  if (!request.apiKey) {
    throw new Error("Deepgram API key is required");
  }

  const model = request.model || "nova-2";
  const language = request.language || "en";

  const response = await fetch(`https://api.deepgram.com/v1/listen?model=${model}&language=${language}&punctuate=true&smart_format=true`, {
    method: "POST",
    headers: {
      "Authorization": `Token ${request.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: request.audioUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram API error: ${error}`);
  }

  const data = await response.json();
  const transcript = data.results?.channels?.[0]?.alternatives?.[0];

  return {
    text: transcript?.transcript || "",
    language: data.results?.channels?.[0]?.detected_language,
    duration: data.metadata?.duration,
    provider: "deepgram",
    confidence: transcript?.confidence,
  };
}

/**
 * Main function to call any STT provider
 */
export async function callSTT(request: STTRequest): Promise<STTResponse> {
  const provider = request.provider || "whisper";

  switch (provider.toLowerCase()) {
    case "whisper":
    case "openai":
      return callWhisper(request);
    
    case "deepgram":
      return callDeepgram(request);
    
    default:
      throw new Error(`Unsupported STT provider: ${provider}`);
  }
}

/**
 * Get available models for a provider
 */
export function getAvailableSTTModels(provider: string): string[] {
  switch (provider.toLowerCase()) {
    case "whisper":
    case "openai":
      return ["whisper-1"];
    
    case "deepgram":
      return [
        "nova-2",
        "nova",
        "enhanced",
        "base",
      ];
    
    default:
      return [];
  }
}

/**
 * Get provider display name
 */
export function getSTTProviderName(provider: string): string {
  const names: Record<string, string> = {
    whisper: "OpenAI Whisper",
    openai: "OpenAI Whisper",
    deepgram: "Deepgram",
  };
  return names[provider.toLowerCase()] || provider;
}
