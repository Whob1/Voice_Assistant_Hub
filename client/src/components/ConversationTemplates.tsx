import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Code, Briefcase, BookOpen, Palette, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  provider: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

const templates: Template[] = [
  {
    id: "creative-writing",
    name: "Creative Writing",
    description: "Imaginative storytelling and creative content generation",
    icon: <Palette className="h-5 w-5" />,
    provider: "openai",
    model: "gpt-4",
    temperature: 90,
    systemPrompt: "You are a creative writing assistant. Help users craft compelling stories, develop characters, and explore imaginative narratives. Be expressive, vivid, and encourage creativity.",
  },
  {
    id: "code-assistant",
    name: "Code Assistant",
    description: "Programming help, debugging, and technical guidance",
    icon: <Code className="h-5 w-5" />,
    provider: "openai",
    model: "gpt-4",
    temperature: 30,
    systemPrompt: "You are an expert programming assistant. Provide clear, accurate code examples, explain technical concepts, help debug issues, and follow best practices. Be precise and thorough.",
  },
  {
    id: "business-advisor",
    name: "Business Advisor",
    description: "Strategic planning, analysis, and professional insights",
    icon: <Briefcase className="h-5 w-5" />,
    provider: "openai",
    model: "gpt-4",
    temperature: 50,
    systemPrompt: "You are a business strategy consultant. Provide professional advice on business planning, market analysis, and strategic decisions. Be analytical, data-driven, and practical.",
  },
  {
    id: "tutor",
    name: "Personal Tutor",
    description: "Educational support and learning assistance",
    icon: <BookOpen className="h-5 w-5" />,
    provider: "openai",
    model: "gpt-4",
    temperature: 40,
    systemPrompt: "You are a patient and knowledgeable tutor. Explain concepts clearly, break down complex topics, provide examples, and encourage learning. Adapt your teaching style to the student's needs.",
  },
  {
    id: "brainstorm",
    name: "Brainstorm Partner",
    description: "Idea generation and creative problem-solving",
    icon: <Sparkles className="h-5 w-5" />,
    provider: "openai",
    model: "gpt-4",
    temperature: 85,
    systemPrompt: "You are a creative brainstorming partner. Generate diverse ideas, explore unconventional solutions, ask thought-provoking questions, and help users think outside the box.",
  },
  {
    id: "quick-answers",
    name: "Quick Answers",
    description: "Fast, concise responses to direct questions",
    icon: <Zap className="h-5 w-5" />,
    provider: "openai",
    model: "gpt-3.5-turbo",
    temperature: 20,
    systemPrompt: "You are a concise assistant. Provide quick, accurate answers to questions. Be brief and to the point while remaining helpful and informative.",
  },
];

export function ConversationTemplates() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const createConversationMutation = trpc.conversations.create.useMutation({
    onSuccess: async (data, variables) => {
      // Update the conversation with template settings
      const template = templates.find(t => t.name === variables.title.replace(" Conversation", ""));
      if (template) {
        await updateConversationMutation.mutateAsync({
          id: data.id,
          llmProvider: template.provider,
          llmModel: template.model,
          temperature: template.temperature,
          systemPrompt: template.systemPrompt,
        });
      }
      
      utils.conversations.list.invalidate();
      toast.success(`${variables.title} created!`);
      setLocation("/");
    },
    onError: (error) => {
      toast.error("Failed to create conversation: " + error.message);
    },
  });

  const updateConversationMutation = trpc.conversations.update.useMutation();

  const handleSelectTemplate = (template: Template) => {
    createConversationMutation.mutate({
      title: `${template.name} Conversation`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conversation Templates</DialogTitle>
          <DialogDescription>
            Start a conversation with pre-configured AI settings optimized for specific use cases
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">{template.description}</CardDescription>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-muted">
                    {template.model}
                  </span>
                  <span className="px-2 py-1 rounded bg-muted">
                    Temp: {(template.temperature / 100).toFixed(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
