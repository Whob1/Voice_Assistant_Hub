import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff } from "lucide-react";

export default function Settings() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  // Fetch data
  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: !!user });
  const { data: providers = [] } = trpc.providers.list.useQuery(undefined, { enabled: !!user });
  const { data: llmProviders = [] } = trpc.chat.getProviders.useQuery(undefined, { enabled: !!user });
  const { data: sttProviders = [] } = trpc.voice.getSttProviders.useQuery(undefined, { enabled: !!user });
  const { data: ttsProviders = [] } = trpc.voice.getTtsProviders.useQuery(undefined, { enabled: !!user });

  // Local state for settings
  const [silenceThreshold, setSilenceThreshold] = useState(1500);
  const [vadSensitivity, setVadSensitivity] = useState(70);
  const [ttsSpeed, setTtsSpeed] = useState(100);
  const [autoPlayTts, setAutoPlayTts] = useState(false);
  const [defaultTextProvider, setDefaultTextProvider] = useState("openai");
  const [defaultTextModel, setDefaultTextModel] = useState("gpt-4");
  const [defaultSttProvider, setDefaultSttProvider] = useState("whisper");
  const [defaultTtsProvider, setDefaultTtsProvider] = useState("elevenlabs");
  const [defaultTtsVoice, setDefaultTtsVoice] = useState("");

  // Provider management state
  const [newProvider, setNewProvider] = useState({ provider: "", apiKey: "", label: "" });
  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});

  // Load settings into state
  useEffect(() => {
    if (settings) {
      setSilenceThreshold(settings.silenceThreshold || 1500);
      setVadSensitivity(settings.vadSensitivity || 70);
      setTtsSpeed(settings.ttsSpeed || 100);
      setAutoPlayTts(settings.autoPlayResponses || false);
      setDefaultTextProvider(settings.defaultTextProvider || "openai");
      setDefaultTextModel(settings.defaultTextModel || "gpt-4");
      setDefaultSttProvider(settings.defaultSttProvider || "whisper");
      setDefaultTtsProvider(settings.defaultTtsProvider || "elevenlabs");
      setDefaultTtsVoice(settings.defaultTtsVoice || "");
    }
  }, [settings]);

  // Mutations
  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const createProviderMutation = trpc.providers.create.useMutation({
    onSuccess: () => {
      utils.providers.list.invalidate();
      setNewProvider({ provider: "", apiKey: "", label: "" });
      toast.success("Provider added successfully!");
    },
    onError: (error) => {
      toast.error("Failed to add provider: " + error.message);
    },
  });

  const deleteProviderMutation = trpc.providers.delete.useMutation({
    onSuccess: () => {
      utils.providers.list.invalidate();
      toast.success("Provider removed!");
    },
  });

  const handleSaveVoiceSettings = () => {
    updateSettingsMutation.mutate({
      silenceThreshold,
      vadSensitivity,
      ttsSpeed,
      autoPlayResponses: autoPlayTts,
      defaultTtsProvider,
      defaultTtsVoice,
    });
  };

  const handleSaveAISettings = () => {
    updateSettingsMutation.mutate({
      defaultTextProvider,
      defaultTextModel,
    });
  };

  const handleAddProvider = () => {
    if (!newProvider.provider || !newProvider.apiKey) {
      toast.error("Provider and API key are required");
      return;
    }

    createProviderMutation.mutate({
      provider: newProvider.provider,
      apiKey: newProvider.apiKey,
      // label: newProvider.label || newProvider.provider,
    });
  };

  const handleDeleteProvider = (id: number) => {
    if (confirm("Are you sure you want to remove this provider?")) {
      deleteProviderMutation.mutate({ id });
    }
  };

  const toggleApiKeyVisibility = (id: number) => {
    setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access settings.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Customize your AI assistant experience</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="ai">AI Providers</TabsTrigger>
            <TabsTrigger value="voice">Voice Settings</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* AI Providers Tab */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Default AI Provider</CardTitle>
                <CardDescription>
                  Choose your preferred AI model for new conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-provider">Text Generation Provider</Label>
                  <Select value={defaultTextProvider} onValueChange={setDefaultTextProvider}>
                    <SelectTrigger id="text-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {llmProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-model">Model</Label>
                  <Select value={defaultTextModel} onValueChange={setDefaultTextModel}>
                    <SelectTrigger id="text-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {llmProviders
                        .find((p) => p.id === defaultTextProvider)
                        ?.models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveAISettings} disabled={updateSettingsMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save AI Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Provider Information</CardTitle>
                <CardDescription>
                  Available AI providers and their capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-border">
                    <h4 className="font-medium mb-1">OpenAI</h4>
                    <p className="text-sm text-muted-foreground">
                      GPT-4, GPT-3.5 Turbo - Built-in support, no API key required
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <h4 className="font-medium mb-1">OpenRouter</h4>
                    <p className="text-sm text-muted-foreground">
                      Access to Mistral, Claude, Llama, and more - Requires API key
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <h4 className="font-medium mb-1">Mistral AI</h4>
                    <p className="text-sm text-muted-foreground">
                      Mistral models including fine-tuned versions - Requires API key
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <h4 className="font-medium mb-1">Anthropic Claude</h4>
                    <p className="text-sm text-muted-foreground">
                      Claude 3.5 Sonnet, Opus, Haiku - Requires API key
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Settings Tab */}
          <TabsContent value="voice" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Voice Recognition</CardTitle>
                <CardDescription>
                  Configure speech-to-text and voice activity detection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="stt-provider">Speech-to-Text Provider</Label>
                  <Select value={defaultSttProvider} onValueChange={setDefaultSttProvider}>
                    <SelectTrigger id="stt-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sttProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {defaultSttProvider === "whisper" 
                      ? "Built-in Whisper support, no API key required"
                      : "Requires API key configuration"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="silence-threshold">
                      Silence Threshold: {silenceThreshold}ms
                    </Label>
                  </div>
                  <Slider
                    id="silence-threshold"
                    min={500}
                    max={3000}
                    step={100}
                    value={[silenceThreshold]}
                    onValueChange={(value) => setSilenceThreshold(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    How long to wait after you stop speaking before ending recording
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vad-sensitivity">
                      Voice Activity Sensitivity: {vadSensitivity}%
                    </Label>
                  </div>
                  <Slider
                    id="vad-sensitivity"
                    min={0}
                    max={100}
                    step={5}
                    value={[vadSensitivity]}
                    onValueChange={(value) => setVadSensitivity(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    How sensitive the system is to detecting speech
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Text-to-Speech</CardTitle>
                <CardDescription>
                  Configure AI voice synthesis settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tts-provider">TTS Provider</Label>
                  <Select value={defaultTtsProvider} onValueChange={setDefaultTtsProvider}>
                    <SelectTrigger id="tts-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ttsProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Requires API key configuration
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tts-voice">Voice ID</Label>
                  <Input
                    id="tts-voice"
                    value={defaultTtsVoice}
                    onChange={(e) => setDefaultTtsVoice(e.target.value)}
                    placeholder="Enter voice ID (e.g., ZF6FPAbjXT4488VcRRnw)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Voice ID from your TTS provider
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tts-speed">Speaking Speed: {ttsSpeed}%</Label>
                  </div>
                  <Slider
                    id="tts-speed"
                    min={50}
                    max={200}
                    step={10}
                    value={[ttsSpeed]}
                    onValueChange={(value) => setTtsSpeed(value[0])}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-play">Auto-play AI Responses</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically play voice for AI responses
                    </p>
                  </div>
                  <Switch
                    id="auto-play"
                    checked={autoPlayTts}
                    onCheckedChange={setAutoPlayTts}
                  />
                </div>

                <Button onClick={handleSaveVoiceSettings} disabled={updateSettingsMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Voice Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Add API Key</CardTitle>
                <CardDescription>
                  Configure API keys for external providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-select">Provider</Label>
                  <Select value={newProvider.provider} onValueChange={(value) => setNewProvider({ ...newProvider, provider: value })}>
                    <SelectTrigger id="provider-select">
                      <SelectValue placeholder="Select provider..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                      <SelectItem value="mistral">Mistral AI</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                      <SelectItem value="deepgram">Deepgram</SelectItem>
                      <SelectItem value="hume">Hume AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Label (Optional)</Label>
                  <Input
                    id="label"
                    value={newProvider.label}
                    onChange={(e) => setNewProvider({ ...newProvider, label: e.target.value })}
                    placeholder="My API Key"
                  />
                </div>

                <Button onClick={handleAddProvider} disabled={createProviderMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Configured Providers</CardTitle>
                <CardDescription>
                  Manage your API keys and provider configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {providers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No providers configured yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {providers.map((provider) => (
                      <div key={provider.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex-1">
                          <h4 className="font-medium">{provider.provider}</h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {showApiKeys[provider.id] 
                              ? provider.apiKey 
                              : '•'.repeat(20)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleApiKeyVisibility(provider.id)}
                          >
                            {showApiKeys[provider.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProvider(provider.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your profile and account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <p className="text-sm">{user.name || "Not set"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm">{user.email || "Not set"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <p className="text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
