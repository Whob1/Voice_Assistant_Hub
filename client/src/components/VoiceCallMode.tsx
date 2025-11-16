import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";


interface VoiceCallModeProps {
  conversationId: number;
  onClose: () => void;
}

export function VoiceCallMode({ conversationId, onClose }: VoiceCallModeProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  const utils = trpc.useUtils();

  const transcribeMutation = trpc.voice.transcribe.useMutation();
  const chatMutation = trpc.chat.send.useMutation();
  const ttsMutation = trpc.voice.generateSpeech.useMutation();

  // Voice Activity Detection
  const detectVoiceActivity = () => {
    if (!analyserRef.current) return false;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    return average > 30; // Threshold for voice detection
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio context for VAD
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];

        // Process the audio
        await processAudio(audioBlob);
      };

      // Start VAD monitoring
      let isSpeaking = false;
      let silenceStart: number | null = null;

      vadIntervalRef.current = setInterval(() => {
        const hasVoice = detectVoiceActivity();

        if (hasVoice) {
          if (!isSpeaking) {
            // Start recording
            isSpeaking = true;
            silenceStart = null;
            if (!isRecordingRef.current && mediaRecorder.state === "inactive") {
              mediaRecorder.start();
              isRecordingRef.current = true;
              setTranscript("Listening...");
            }
          }
        } else {
          if (isSpeaking) {
            // Detect silence
            if (!silenceStart) {
              silenceStart = Date.now();
            } else if (Date.now() - silenceStart > 1500) {
              // 1.5 seconds of silence
              isSpeaking = false;
              silenceStart = null;
              if (isRecordingRef.current && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
                isRecordingRef.current = false;
              }
            }
          }
        }
      }, 100);

      setIsActive(true);
      toast.success("Voice call started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    isRecordingRef.current = false;
    setIsActive(false);
    toast.info("Voice call ended");
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setTranscript("Processing...");

    try {
      // Upload audio
      const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", audioFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload audio");
      }

      const { url: audioUrl } = await uploadResponse.json();

      // Transcribe
      const transcription = await transcribeMutation.mutateAsync({ audioUrl });
      setTranscript(transcription.text);

      if (!transcription.text.trim()) {
        setIsProcessing(false);
        return;
      }

      // Get AI response
      const response = await chatMutation.mutateAsync({
        conversationId,
        message: transcription.text,
      });

      setAiResponse(response.content);

      // Generate and play TTS
      const ttsResult = await ttsMutation.mutateAsync({ text: response.content });
      
      // Play audio
      const audio = new Audio(ttsResult.audioUrl);
      audio.onended = () => {
        setAiResponse("");
        setTranscript("");
        setIsProcessing(false);
      };
      audio.play();

      // Invalidate messages
      utils.messages.list.invalidate({ conversationId });
    } catch (error: any) {
      console.error("Processing error:", error);
      toast.error("Failed to process audio: " + error.message);
      setIsProcessing(false);
    }
  };

  const handleToggleCall = () => {
    if (isActive) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleToggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <Card className="glass p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Voice Call Mode</h2>
            <p className="text-muted-foreground">
              {isActive ? "Speak naturally - AI will respond automatically" : "Start a voice conversation"}
            </p>
          </div>

          {/* Status Display */}
          <div className="space-y-3 min-h-[120px]">
            {transcript && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-1">You said:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}
            {aiResponse && (
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-sm font-medium mb-1">AI:</p>
                <p className="text-sm">{aiResponse}</p>
              </div>
            )}
            {isProcessing && !aiResponse && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4">
            {isActive && (
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={handleToggleMute}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
            )}

            <Button
              variant={isActive ? "destructive" : "default"}
              size="icon"
              className="h-16 w-16 rounded-full"
              onClick={handleToggleCall}
            >
              {isActive ? <PhoneOff className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </Button>
          </div>

          {/* Close Button */}
          <Button variant="ghost" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
