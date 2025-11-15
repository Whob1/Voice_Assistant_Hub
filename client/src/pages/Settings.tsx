import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Settings() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const { data: settings } = trpc.settings.get.useQuery();
  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Settings saved!");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const [formData, setFormData] = useState({
    silenceThreshold: settings?.silenceThreshold || 1500,
    vadSensitivity: settings?.vadSensitivity || 70,
    ttsSpeed: settings?.ttsSpeed || 100,
    autoPlayResponses: settings?.autoPlayResponses ?? true,
  });

  const handleSaveSettings = async () => {
    await updateSettingsMutation.mutateAsync(formData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container max-w-6xl py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>

        <div className="glass-strong rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-6">
            Customize your AI assistant experience
          </p>

          <Tabs defaultValue="voice" className="space-y-6">
            <TabsList>
              <TabsTrigger value="voice">Voice Settings</TabsTrigger>
              <TabsTrigger value="ai">AI Providers</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Voice Recognition</CardTitle>
                  <CardDescription>
                    Configure voice activity detection and silence thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="silenceThreshold">
                      Silence Threshold (ms): {formData.silenceThreshold}
                    </Label>
                    <Input
                      id="silenceThreshold"
                      type="range"
                      min="500"
                      max="3000"
                      step="100"
                      value={formData.silenceThreshold}
                      onChange={(e) =>
                        setFormData({ ...formData, silenceThreshold: parseInt(e.target.value) })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      How long to wait after you stop speaking before processing
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vadSensitivity">
                      Voice Detection Sensitivity: {formData.vadSensitivity}%
                    </Label>
                    <Input
                      id="vadSensitivity"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.vadSensitivity}
                      onChange={(e) =>
                        setFormData({ ...formData, vadSensitivity: parseInt(e.target.value) })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Higher values make the assistant more sensitive to quiet speech
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text-to-Speech</CardTitle>
                  <CardDescription>
                    Configure how the AI assistant speaks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="ttsSpeed">
                      Speaking Speed: {formData.ttsSpeed}%
                    </Label>
                    <Input
                      id="ttsSpeed"
                      type="range"
                      min="50"
                      max="200"
                      step="10"
                      value={formData.ttsSpeed}
                      onChange={(e) =>
                        setFormData({ ...formData, ttsSpeed: parseInt(e.target.value) })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Adjust the playback speed of voice responses
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoPlay">Auto-play Responses</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically play voice responses
                      </p>
                    </div>
                    <Switch
                      id="autoPlay"
                      checked={formData.autoPlayResponses}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, autoPlayResponses: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Voice Settings
              </Button>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Provider Configuration</CardTitle>
                  <CardDescription>
                    Manage your AI provider API keys and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">
                      This application uses the built-in Manus AI services.
                    </p>
                    <p className="text-sm">
                      Custom provider configuration coming soon!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm mt-1">{user.name || "Not set"}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm mt-1">{user.email || "Not set"}</p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <p className="text-sm mt-1 capitalize">{user.role}</p>
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <p className="text-sm mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
