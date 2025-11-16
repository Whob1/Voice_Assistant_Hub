import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Phone } from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";
import { AudioPlayer } from "./AudioPlayer";
import { ConversationSettings } from "./ConversationSettings";
import { ExportConversation } from "./ExportConversation";
import { VoiceCallMode } from "./VoiceCallMode";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

interface ChatInterfaceProps {
  conversationId: number;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [], isLoading } = trpc.messages.list.useQuery(
    { conversationId },
    { refetchInterval: false }
  );

  const sendMessageMutation = trpc.chat.send.useMutation({
    onMutate: async () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      utils.messages.list.invalidate({ conversationId });
      setInputValue("");
      setIsTyping(false);
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
      setIsTyping(false);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sendMessageMutation.isPending) return;

    const message = inputValue.trim();
    setInputValue("");

    await sendMessageMutation.mutateAsync({
      conversationId,
      message,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTranscription = (text: string) => {
    setInputValue(text);
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="border-b border-border p-3 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowVoiceCall(true)}
        >
          <Phone className="h-4 w-4 mr-2" />
          Voice Call
        </Button>
        <ExportConversation conversationId={conversationId} />
        <ConversationSettings conversationId={conversationId} />
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground max-w-md">
                Type a message or use voice input to chat with your AI assistant.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 message-enter ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "glass"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Streamdown>{message.content}</Streamdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1">
                      <AudioPlayer text={message.content} messageId={message.id} />
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-5 w-5 text-secondary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 message-enter">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div className="glass rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-foreground/60 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-foreground/60 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-foreground/60 rounded-full typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Voice Call Modal */}
      {showVoiceCall && (
        <VoiceCallMode
          conversationId={conversationId}
          onClose={() => setShowVoiceCall(false)}
        />
      )}

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <VoiceRecorder
            onTranscriptionComplete={handleTranscription}
            isDisabled={sendMessageMutation.isPending}
          />
          
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Ctrl+Enter to send)"
            onKeyDown={handleKeyDown}
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || sendMessageMutation.isPending}
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
