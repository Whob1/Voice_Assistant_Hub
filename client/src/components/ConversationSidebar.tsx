import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MessageSquare, Trash2, Settings, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";

interface ConversationSidebarProps {
  currentConversationId?: number;
  onConversationSelect: (id: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ConversationSidebar({
  currentConversationId,
  onConversationSelect,
  isOpen = true,
  onClose,
}: ConversationSidebarProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const utils = trpc.useUtils();

  const { data: conversations = [] } = trpc.conversations.list.useQuery();

  const createConversationMutation = trpc.conversations.create.useMutation({
    onSuccess: (data) => {
      utils.conversations.list.invalidate();
      setIsCreateDialogOpen(false);
      setNewConversationTitle("");
      onConversationSelect(data.id);
      toast.success("Conversation created!");
    },
    onError: (error) => {
      toast.error("Failed to create conversation: " + error.message);
    },
  });

  const deleteConversationMutation = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate();
      toast.success("Conversation deleted!");
    },
    onError: (error) => {
      toast.error("Failed to delete conversation: " + error.message);
    },
  });

  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim()) {
      toast.error("Please enter a conversation title");
      return;
    }

    await createConversationMutation.mutateAsync({
      title: newConversationTitle.trim(),
    });
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    await deleteConversationMutation.mutateAsync({ id });
    
    if (currentConversationId === id && conversations.length > 1) {
      const nextConversation = conversations.find(c => c.id !== id);
      if (nextConversation) {
        onConversationSelect(nextConversation.id);
      }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
          w-80 border-r border-border flex flex-col h-full glass
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="default">
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Conversation title..."
                  value={newConversationTitle}
                  onChange={(e) => setNewConversationTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleCreateConversation();
                    }
                  }}
                />
                <Button
                  onClick={handleCreateConversation}
                  disabled={createConversationMutation.isPending}
                  className="w-full"
                >
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No conversations yet.
                <br />
                Create one to get started!
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    onConversationSelect(conversation.id);
                    onClose?.();
                  }}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors group hover:bg-accent ${
                    currentConversationId === conversation.id
                      ? "bg-accent"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <MessageSquare className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{conversation.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
