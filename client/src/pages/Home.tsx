import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ConversationTemplates } from "@/components/ConversationTemplates";
import { ChatInterface } from "@/components/ChatInterface";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Menu } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: conversations = [] } = trpc.conversations.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createConversationMutation = trpc.conversations.create.useMutation({
    onSuccess: (data) => {
      utils.conversations.list.invalidate();
      setSelectedConversationId(data.id);
    },
  });

  // Auto-select first conversation or create one
  useEffect(() => {
    if (!user || loading) return;

    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    } else if (conversations.length === 0 && !createConversationMutation.isPending) {
      createConversationMutation.mutate({
        title: "New Conversation",
      });
    }
  }, [user, loading, conversations, selectedConversationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="glass-strong rounded-2xl p-12 max-w-2xl mx-4 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            AI Voice Assistant Hub
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Your sophisticated AI assistant with advanced voice capabilities, 
            multi-provider support, and intelligent conversation management.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 text-left">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <h3 className="font-semibold">Voice-First Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time voice transcription and natural conversation flow
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-left">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <h3 className="font-semibold">Multi-Provider AI</h3>
                <p className="text-sm text-muted-foreground">
                  Powered by cutting-edge AI models for the best responses
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-left">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <h3 className="font-semibold">Smart Conversations</h3>
                <p className="text-sm text-muted-foreground">
                  Organized threads with context-aware responses
                </p>
              </div>
            </div>
          </div>

          <Button size="lg" asChild className="px-8">
            <a href={getLoginUrl()}>
              Get Started
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex gradient-bg">
      <ConversationSidebar
        currentConversationId={selectedConversationId || undefined}
        onConversationSelect={setSelectedConversationId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden border-b border-border p-4 glass">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {selectedConversationId ? (
          <ChatInterface conversationId={selectedConversationId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading conversation...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
