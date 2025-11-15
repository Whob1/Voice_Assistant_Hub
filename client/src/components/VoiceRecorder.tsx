import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  isDisabled?: boolean;
}

export function VoiceRecorder({ onTranscriptionComplete, isDisabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { data: settings } = trpc.settings.get.useQuery();
  const uploadAudioMutation = trpc.voice.uploadAudio.useMutation();
  const transcribeMutation = trpc.voice.transcribe.useMutation();

  const silenceThreshold = settings?.silenceThreshold || 1500;
  const vadSensitivity = (settings?.vadSensitivity || 70) / 100;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Voice Activity Detection with silence detection
  const detectVoiceActivity = (dataArray: Uint8Array) => {
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalizedLevel = average / 255;
    setAudioLevel(normalizedLevel);

    const isCurrentlySpeaking = normalizedLevel > vadSensitivity * 0.15; // Threshold for speech

    if (isCurrentlySpeaking) {
      setIsSpeaking(true);
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else if (isSpeaking && !silenceTimeoutRef.current) {
      // User stopped speaking, start silence timer
      silenceTimeoutRef.current = setTimeout(() => {
        // Auto-stop recording after silence threshold
        if (isRecording) {
          stopRecording();
          toast.info("Recording stopped (silence detected)");
        }
      }, silenceThreshold);
    }
  };

  // Visualize audio levels with VAD
  const visualizeAudio = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyser.getByteFrequencyData(dataArray);
      detectVoiceActivity(dataArray);

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Check file size (16MB limit)
        if (audioBlob.size > 16 * 1024 * 1024) {
          toast.error("Audio file too large. Please record a shorter message.");
          return;
        }

        // Check if recording is too short (less than 0.5 seconds)
        if (audioBlob.size < 5000) {
          toast.warning("Recording too short. Please try again.");
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            // Upload audio
            const uploadResult = await uploadAudioMutation.mutateAsync({
              audioData: base64Audio,
              fileName: `recording-${Date.now()}.webm`,
              mimeType: 'audio/webm',
            });

            // Transcribe
            const transcription = await transcribeMutation.mutateAsync({
              audioUrl: uploadResult.url,
            });

            onTranscriptionComplete(transcription.text);
            toast.success("Voice message transcribed!");
          } catch (error) {
            console.error("Transcription error:", error);
            toast.error("Failed to transcribe audio. Please try again.");
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      visualizeAudio(stream);
      mediaRecorder.start();
      setIsRecording(true);
      setIsSpeaking(false);
      toast.info("Recording started... Speak now!");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      setIsSpeaking(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  const isProcessing = uploadAudioMutation.isPending || transcribeMutation.isPending;

  return (
    <div className="flex items-center gap-3">
      {/* Waveform visualization */}
      {isRecording && (
        <div className="flex items-center gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all wave-bar ${
                isSpeaking ? 'bg-primary' : 'bg-muted-foreground'
              }`}
              style={{
                height: `${Math.max(8, audioLevel * 32)}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Recording button */}
      <Button
        size="icon"
        variant={isRecording ? "destructive" : "default"}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled || isProcessing}
        className="relative"
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isRecording ? (
          <>
            <Square className="h-5 w-5" />
            <span className="absolute inset-0 rounded-full bg-destructive opacity-75 pulse-ring" />
          </>
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>

      {isRecording && (
        <span className="text-sm text-muted-foreground">
          {isSpeaking ? (
            <span className="text-primary font-medium animate-pulse">Listening...</span>
          ) : (
            <span>Waiting for speech...</span>
          )}
        </span>
      )}
    </div>
  );
}
