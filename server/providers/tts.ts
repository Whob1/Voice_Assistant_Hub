export interface TTSRequest {
  text: string;
  provider?: string;
  voice?: string;
  apiKey?: string;
  model?: string;
  speed?: number;
}

export interface TTSResponse {
  audioUrl: string;
  provider: string;
  voice: string;
  duration?: number;
}

/**
 * Call ElevenLabs TTS
 */
async function callElevenLabs(request: TTSRequest): Promise<TTSResponse> {
  if (!request.apiKey) {
    throw new Error("ElevenLabs API key is required");
  }

  const voiceId = request.voice || "ZF6FPAbjXT4488VcRRnw"; // Default voice
  const model = request.model || "eleven_turbo_v2_5";

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": request.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: request.text,
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  // Get audio as buffer
  const audioBuffer = await response.arrayBuffer();
  
  // In production, upload to S3 and return URL
  // For now, return a data URL (not recommended for large files)
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

  return {
    audioUrl,
    provider: "elevenlabs",
    voice: voiceId,
  };
}

/**
 * Call Hume AI TTS (with emotion)
 */
async function callHume(request: TTSRequest): Promise<TTSResponse> {
  if (!request.apiKey) {
    throw new Error("Hume API key is required");
  }

  // Hume AI TTS endpoint
  const response = await fetch("https://api.hume.ai/v0/tts/batch", {
    method: "POST",
    headers: {
      "X-Hume-Api-Key": request.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: request.text,
      voice: request.voice || "default",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hume API error: ${error}`);
  }

  const data = await response.json();

  return {
    audioUrl: data.audio_url || "",
    provider: "hume",
    voice: request.voice || "default",
  };
}

/**
 * Main function to call any TTS provider
 */
export async function callTTS(request: TTSRequest): Promise<TTSResponse> {
  const provider = request.provider || "elevenlabs";

  switch (provider.toLowerCase()) {
    case "elevenlabs":
      return callElevenLabs(request);
    
    case "hume":
      return callHume(request);
    
    default:
      throw new Error(`Unsupported TTS provider: ${provider}`);
  }
}

/**
 * Get available voices for a provider
 */
export async function getAvailableVoices(provider: string, apiKey?: string): Promise<Array<{ id: string; name: string }>> {
  switch (provider.toLowerCase()) {
    case "elevenlabs":
      if (!apiKey) return [];
      
      try {
        const response = await fetch("https://api.elevenlabs.io/v1/voices", {
          headers: {
            "xi-api-key": apiKey,
          },
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.voices.map((v: any) => ({
          id: v.voice_id,
          name: v.name,
        }));
      } catch {
        return [];
      }
    
    case "hume":
      return [
        { id: "default", name: "Default" },
        { id: "expressive", name: "Expressive" },
        { id: "calm", name: "Calm" },
      ];
    
    default:
      return [];
  }
}

/**
 * Get provider display name
 */
export function getTTSProviderName(provider: string): string {
  const names: Record<string, string> = {
    elevenlabs: "ElevenLabs",
    hume: "Hume AI",
    openai: "OpenAI TTS",
  };
  return names[provider.toLowerCase()] || provider;
}
