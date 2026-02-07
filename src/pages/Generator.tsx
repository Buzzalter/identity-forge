import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { LoadingOverlay } from '@/components/LoadingSpinner';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { SaveProfileModal } from '@/components/SaveProfileModal';
import { MainLayout } from '@/components/MainLayout';
import {
  useGenerateIdentityWithProgress,
  useRegenerateImage,
  useRegenerateVoice,
  useSaveProfile,
} from '@/hooks/use-identity';
import { GeneratedIdentity } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Generator() {
  const [description, setDescription] = useState('');
  const [identity, setIdentity] = useState<GeneratedIdentity | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const { generate, progress, isGenerating } = useGenerateIdentityWithProgress();
  const regenerateImageMutation = useRegenerateImage();
  const regenerateVoiceMutation = useRegenerateVoice();
  const saveMutation = useSaveProfile();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!description.trim()) return;
    try {
      const result = await generate(description);
      if (result) {
        setIdentity(result);
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate identity',
        variant: 'destructive',
      });
    }
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

  const handleSave = async (name: string, bio: string) => {
    if (!identity) return;
    await saveMutation.mutateAsync({
      name,
      bio: bio || identity.bio,
      imageBase64: identity.image_base64,
      audioBase64: identity.audio_base64,
    });
    setSaveModalOpen(false);
  };

  const isRegeneratingImage = regenerateImageMutation.isPending;
  const isRegeneratingVoice = regenerateVoiceMutation.isPending;
  const isProcessing = isGenerating || isRegeneratingImage || isRegeneratingVoice;

  return (
    <MainLayout>
      <div className="h-full flex flex-col animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Identity Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create passport-style identities from text descriptions
          </p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex-1 grid lg:grid-cols-2 gap-6 min-h-0">
          {/* Left Column - Input */}
          <div className="flex flex-col gap-4">
            <Card className="border-border/50 card-glow-hover">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </h2>
                </div>
                
                <Textarea
                  placeholder="Describe the identity you want to generate...&#10;&#10;e.g., A 40-year-old French diplomat with distinguished gray temples..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-[100px] resize-none bg-input/50 border-border/50 focus:border-primary/50 transition-colors text-sm"
                  disabled={isProcessing}
                />
                
                <Button
                  onClick={handleGenerate}
                  disabled={!description.trim() || isProcessing}
                  className="mt-3 w-full h-10 font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Identity
                </Button>
              </CardContent>
            </Card>

            {/* Progress Section */}
            {isGenerating && (
              <Card className="border-border/50 animate-fade-in">
                <CardContent className="p-5">
                  <ProgressIndicator progress={progress} isGenerating={isGenerating} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Output */}
          <div className="flex flex-col min-h-0">
            {identity ? (
              <Card className="flex-1 border-border/50 card-glow relative overflow-hidden">
                <CardContent className="p-5 h-full flex flex-col">
                  {/* Header with Save Button */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Generated Identity
                      </h2>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSaveModalOpen(true)}
                      disabled={isProcessing}
                      className="border-border/50 hover:bg-accent hover:border-primary/30"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </Button>
                  </div>

                  <div className="flex-1 flex flex-col gap-4 overflow-auto">
                    {/* Image Section */}
                    <div className="space-y-2">
                      <div className="relative aspect-[4/5] max-h-[280px] bg-muted/30 rounded-lg overflow-hidden border border-border/30">
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
                        className="w-full border-border/50 hover:bg-accent hover:border-primary/30 h-8 text-xs"
                        size="sm"
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Regenerate Image
                      </Button>
                    </div>

                    {/* Bio Section */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Biography
                      </h3>
                      <div className="bg-muted/20 rounded-lg p-3 border border-border/30 max-h-[120px] overflow-auto">
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                          {identity.bio}
                        </p>
                      </div>
                    </div>

                    {/* Audio Section */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Voice Sample
                      </h3>
                      <div className="relative bg-muted/20 rounded-lg p-2 border border-border/30">
                        {isRegeneratingVoice && (
                          <LoadingOverlay text="Regenerating voice..." />
                        )}
                        <audio
                          controls
                          className="w-full h-8"
                          src={`data:audio/mp3;base64,${identity.audio_base64}`}
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleRegenerateVoice}
                        disabled={isProcessing}
                        className="w-full border-border/50 hover:bg-accent hover:border-primary/30 h-8 text-xs"
                        size="sm"
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Regenerate Voice
                      </Button>
                    </div>

                    {/* Debug/Info Section */}
                    <Collapsible open={showPrompts} onOpenChange={setShowPrompts}>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-between text-muted-foreground hover:text-foreground hover:bg-muted/30 h-8"
                        >
                          <span className="text-xs uppercase tracking-wider">Show Prompts</span>
                          {showPrompts ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 pt-2">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">
                            Image Prompt
                          </h4>
                          <pre className="text-xs bg-muted/30 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap border border-border/30 text-foreground/80">
                            {identity.image_prompt}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">
                            Voice Prompt
                          </h4>
                          <pre className="text-xs bg-muted/30 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap border border-border/30 text-foreground/80">
                            {identity.voice_prompt}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Empty State */
              <Card className="flex-1 border-border/30 border-dashed">
                <CardContent className="h-full flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-base font-medium text-muted-foreground mb-1">
                      No Identity Generated
                    </h3>
                    <p className="text-sm text-muted-foreground/70 max-w-[240px]">
                      Enter a description and click generate to create a new identity
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <SaveProfileModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
        defaultBio={description}
      />
    </MainLayout>
  );
}
