import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AudioPlayerProps {
  text: string;
  messageId?: number;
}

export function AudioPlayer({ text, messageId }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateSpeechMutation = trpc.voice.generateSpeech.useMutation({
    onSuccess: (data) => {
      setAudioUrl(data.audioUrl);
      setIsLoading(false);
      // Auto-play after generation
      playAudio(data.audioUrl);
    },
    onError: (error) => {
      toast.error("Failed to generate speech: " + error.message);
      setIsLoading(false);
    },
  });

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
    audio.onerror = () => {
      toast.error("Failed to play audio");
      setIsPlaying(false);
      audioRef.current = null;
    };

    audio.play().catch((error) => {
      console.error("Audio playback error:", error);
      toast.error("Failed to play audio");
      setIsPlaying(false);
    });
  };

  const handlePlayPause = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audioUrl) {
      playAudio(audioUrl);
    } else {
      // Generate TTS
      setIsLoading(true);
      generateSpeechMutation.mutate({ text });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePlayPause}
      disabled={isLoading}
      className="h-8 w-8"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
