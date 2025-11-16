import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Save, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ConversationSettingsProps {
  conversationId: number;
}

export function ConversationSettings({ conversationId }: ConversationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: conversation } = trpc.conversations.get.useQuery({ id: conversationId });
  const { data: llmProviders = [] } = trpc.chat.getProviders.useQuery();

  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4");
  const [customModel, setCustomModel] = useState("");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [temperature, setTemperature] = useState(70);
  const [systemPrompt, setSystemPrompt] = useState("");

  useEffect(() => {
    if (conversation) {
      setProvider(conversation.llmProvider || "openai");
      const currentModel = conversation.llmModel || "gpt-4";
      setModel(currentModel);
      
      // Check if current model is in the available models list
      const providerData = llmProviders.find((p) => p.id === (conversation.llmProvider || "openai"));
      const isCustom = providerData && !providerData.models.includes(currentModel);
      
      if (isCustom) {
        setUseCustomModel(true);
        setCustomModel(currentModel);
      } else {
        setUseCustomModel(false);
        setCustomModel("");
      }
      
      setTemperature(conversation.temperature || 70);
      setSystemPrompt(conversation.systemPrompt || "");
    }
  }, [conversation, llmProviders]);

  const updateConversationMutation = trpc.conversations.update.useMutation({
    onSuccess: () => {
      utils.conversations.get.invalidate({ id: conversationId });
      toast.success("Conversation settings updated!");
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  const handleSave = () => {
    const finalModel = useCustomModel ? customModel.trim() : model;
    
    if (!finalModel) {
      toast.error("Please select or enter a model");
      return;
    }
    
    updateConversationMutation.mutate({
      id: conversationId,
      llmProvider: provider,
      llmModel: finalModel,
      temperature,
      systemPrompt: systemPrompt || undefined,
    });
  };

  const availableModels = llmProviders.find((p) => p.id === provider)?.models || [];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Conversation Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure AI Model
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="text-xs text-muted-foreground">
              Current: {conversation?.llmModel || "gpt-4"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversation Settings</DialogTitle>
            <DialogDescription>
              Customize AI provider, model, and behavior for this conversation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {llmProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="model">Model</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseCustomModel(!useCustomModel)}
                  className="h-7 text-xs"
                >
                  {useCustomModel ? "Use Preset" : "Custom Model"}
                </Button>
              </div>
              
              {useCustomModel ? (
                <div className="space-y-2">
                  <Input
                    id="custom-model"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g., mistral-small-ft-abc123 or openrouter/model-name"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your fine-tuned model ID or any custom model identifier
                  </p>
                </div>
              ) : (
                <>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.length > 0 ? (
                        availableModels.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No models available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {provider !== "openai" && "Requires API key configuration in Settings"}
                  </p>
                </>
              )}
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperature: {(temperature / 100).toFixed(2)}</Label>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={200}
                step={5}
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
              />
              <p className="text-xs text-muted-foreground">
                Lower = more focused, Higher = more creative
              </p>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful AI assistant..."
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Custom instructions for how the AI should behave
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateConversationMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
