import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Save, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { LoadingOverlay } from '@/components/LoadingSpinner';
import { SaveProfileModal } from '@/components/SaveProfileModal';
import { MainLayout } from '@/components/MainLayout';
import {
  useGenerateIdentity,
  useRegenerateImage,
  useRegenerateVoice,
  useSaveProfile,
} from '@/hooks/use-identity';
import { GeneratedIdentity } from '@/lib/api';

export default function Generator() {
  const [description, setDescription] = useState('');
  const [identity, setIdentity] = useState<GeneratedIdentity | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const generateMutation = useGenerateIdentity();
  const regenerateImageMutation = useRegenerateImage();
  const regenerateVoiceMutation = useRegenerateVoice();
  const saveMutation = useSaveProfile();

  const handleGenerate = async () => {
    if (!description.trim()) return;
    const result = await generateMutation.mutateAsync(description);
    setIdentity(result);
  };

  const handleRegenerateImage = async () => {
    if (!identity) return;
    const result = await regenerateImageMutation.mutateAsync(identity.image_prompt);
    setIdentity((prev) =>
      prev ? { ...prev, image_base64: result.image_base64 } : null
    );
  };

  const handleRegenerateVoice = async () => {
    if (!identity) return;
    const result = await regenerateVoiceMutation.mutateAsync({
      voicePrompt: identity.voice_prompt,
      bio: identity.bio,
    });
    setIdentity((prev) =>
      prev ? { ...prev, audio_base64: result.audio_base64 } : null
    );
  };

  const handleSave = async (name: string) => {
    if (!identity) return;
    await saveMutation.mutateAsync({
      name,
      bio: identity.bio,
      imageBase64: identity.image_base64,
      audioBase64: identity.audio_base64,
    });
    setSaveModalOpen(false);
  };

  const isGenerating = generateMutation.isPending;
  const isRegeneratingImage = regenerateImageMutation.isPending;
  const isRegeneratingVoice = regenerateVoiceMutation.isPending;
  const isProcessing = isGenerating || isRegeneratingImage || isRegeneratingVoice;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Identity Generator</h1>
          <p className="text-muted-foreground mt-1">
            Create passport-style identities from text descriptions
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe the identity you want to generate...&#10;&#10;e.g., A 40-year-old French diplomat with distinguished gray temples, sharp blue eyes, and a diplomatic demeanor. Speaks with a refined Parisian accent."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isProcessing}
            />
            <Button
              onClick={handleGenerate}
              disabled={!description.trim() || isProcessing}
              className="w-full sm:w-auto"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Identity
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {(identity || isGenerating) && (
          <Card className="relative overflow-hidden">
            {isGenerating && <LoadingOverlay text="Generating identity..." />}
            
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Generated Identity</CardTitle>
                {identity && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSaveModalOpen(true)}
                    disabled={isProcessing}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {identity && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Visual */}
                  <div className="space-y-4">
                    <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                      {isRegeneratingImage && (
                        <LoadingOverlay text="Regenerating image..." />
                      )}
                      <img
                        src={`data:image/png;base64,${identity.image_base64}`}
                        alt="Generated passport photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRegenerateImage}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Image
                    </Button>
                  </div>

                  {/* Right Column - Audio/Bio */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Biography
                      </h3>
                      <div className="prose prose-sm prose-slate max-w-none">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {identity.bio}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Voice Sample
                      </h3>
                      <div className="relative">
                        {isRegeneratingVoice && (
                          <LoadingOverlay text="Regenerating voice..." />
                        )}
                        <audio
                          controls
                          className="w-full h-10"
                          src={`data:audio/mp3;base64,${identity.audio_base64}`}
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleRegenerateVoice}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Voice
                      </Button>
                    </div>

                    {/* Debug/Info Section */}
                    <Collapsible open={showPrompts} onOpenChange={setShowPrompts}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between">
                          <span className="text-muted-foreground">Show Prompts</span>
                          {showPrompts ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-3">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">
                            Image Prompt
                          </h4>
                          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                            {identity.image_prompt}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">
                            Voice Prompt
                          </h4>
                          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                            {identity.voice_prompt}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <SaveProfileModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
      />
    </MainLayout>
  );
}
