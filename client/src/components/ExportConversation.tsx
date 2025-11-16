import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExportConversationProps {
  conversationId: number;
}

export function ExportConversation({ conversationId }: ExportConversationProps) {
  const { data: conversation } = trpc.conversations.get.useQuery({ id: conversationId });
  const { data: messages = [] } = trpc.messages.list.useQuery({ conversationId });

  const exportAsJSON = () => {
    const data = {
      conversation: {
        id: conversation?.id,
        title: conversation?.title,
        createdAt: conversation?.createdAt,
        updatedAt: conversation?.updatedAt,
        llmProvider: conversation?.llmProvider,
        llmModel: conversation?.llmModel,
        temperature: conversation?.temperature,
        systemPrompt: conversation?.systemPrompt,
      },
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        provider: m.provider,
        model: m.model,
        tokenCount: m.tokenCount,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${conversation?.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Conversation exported as JSON!");
  };

  const exportAsMarkdown = () => {
    let markdown = `# ${conversation?.title || "Conversation"}\n\n`;
    markdown += `**Created:** ${new Date(conversation?.createdAt || "").toLocaleString()}\n`;
    markdown += `**Model:** ${conversation?.llmModel || "N/A"}\n`;
    markdown += `**Provider:** ${conversation?.llmProvider || "N/A"}\n\n`;
    markdown += `---\n\n`;

    messages.forEach((message) => {
      const timestamp = new Date(message.createdAt).toLocaleString();
      const role = message.role === "user" ? "👤 User" : "🤖 Assistant";
      
      markdown += `### ${role}\n`;
      markdown += `*${timestamp}*\n\n`;
      markdown += `${message.content}\n\n`;
      
      if (message.tokenCount) {
        markdown += `*Tokens: ${message.tokenCount}*\n\n`;
      }
      
      markdown += `---\n\n`;
    });

    markdown += `\n*Exported: ${new Date().toLocaleString()}*\n`;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${conversation?.id}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Conversation exported as Markdown!");
  };

  const exportAsText = () => {
    let text = `${conversation?.title || "Conversation"}\n`;
    text += `${"=".repeat((conversation?.title || "Conversation").length)}\n\n`;
    text += `Created: ${new Date(conversation?.createdAt || "").toLocaleString()}\n`;
    text += `Model: ${conversation?.llmModel || "N/A"}\n`;
    text += `Provider: ${conversation?.llmProvider || "N/A"}\n\n`;
    text += `${"-".repeat(80)}\n\n`;

    messages.forEach((message, index) => {
      const timestamp = new Date(message.createdAt).toLocaleString();
      const role = message.role === "user" ? "USER" : "ASSISTANT";
      
      text += `[${timestamp}] ${role}:\n`;
      text += `${message.content}\n`;
      
      if (message.tokenCount) {
        text += `(Tokens: ${message.tokenCount})\n`;
      }
      
      if (index < messages.length - 1) {
        text += `\n${"-".repeat(80)}\n\n`;
      }
    });

    text += `\n\nExported: ${new Date().toLocaleString()}\n`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${conversation?.id}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Conversation exported as text!");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Download className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Conversation</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsText}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
