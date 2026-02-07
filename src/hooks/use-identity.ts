import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import { api, GeneratedIdentity, SavedProfile, GenerationProgress } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Hook for generating identity with progress polling
export function useGenerateIdentityWithProgress() {
  const { toast } = useToast();
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const generate = useCallback(async (description: string): Promise<GeneratedIdentity | null> => {
    setIsGenerating(true);
    setProgress({ status: 'pending', step: 'analyzing', progress: 0, message: 'Starting generation...' });

    try {
      // Try the new async endpoint first
      const { task_id } = await api.startGeneration(description);

      // Poll for progress
      return new Promise((resolve, reject) => {
        pollingRef.current = setInterval(async () => {
          try {
            const progressData = await api.getProgress(task_id);
            setProgress(progressData);

            if (progressData.status === 'completed') {
              stopPolling();
              const result = await api.getResult(task_id);
              setIsGenerating(false);
              setProgress(null);
              resolve(result);
            } else if (progressData.status === 'failed') {
              stopPolling();
              setIsGenerating(false);
              setProgress(null);
              reject(new Error(progressData.message || 'Generation failed'));
            }
          } catch (err) {
            // If polling fails, continue trying
            console.warn('Progress polling error:', err);
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (pollingRef.current) {
            stopPolling();
            setIsGenerating(false);
            setProgress(null);
            reject(new Error('Generation timed out'));
          }
        }, 300000);
      });
    } catch (error) {
      // Fallback to synchronous generation if async endpoints don't exist
      console.log('Falling back to synchronous generation');
      
      // Simulate progress for synchronous call
      const simulateProgress = async () => {
        const steps = [
          { step: 'analyzing', progress: 10, message: 'Analyzing your description...' },
          { step: 'bio', progress: 30, message: 'Crafting biography...' },
          { step: 'image', progress: 50, message: 'Generating portrait image...' },
          { step: 'voice', progress: 75, message: 'Synthesizing voice sample...' },
          { step: 'finalizing', progress: 90, message: 'Finalizing identity...' },
        ];

        for (const step of steps) {
          setProgress({ status: 'processing', ...step });
          await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
        }
      };

      try {
        const progressPromise = simulateProgress();
        const result = await api.generateIdentity(description);
        await progressPromise;
        
        setProgress({ status: 'completed', step: 'finalizing', progress: 100, message: 'Complete!' });
        await new Promise(r => setTimeout(r, 500));
        
        setIsGenerating(false);
        setProgress(null);
        return result;
      } catch (err) {
        setIsGenerating(false);
        setProgress(null);
        throw err;
      }
    }
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setIsGenerating(false);
    setProgress(null);
  }, [stopPolling]);

  return {
    generate,
    progress,
    isGenerating,
    reset,
  };
}

// Legacy hook for generating a new identity (kept for compatibility)
export function useGenerateIdentity() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (description: string) => api.generateIdentity(description),
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate identity. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

// Hook for regenerating just the image
export function useRegenerateImage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (imagePrompt: string) => api.regenerateImage(imagePrompt),
    onError: (error: Error) => {
      toast({
        title: 'Image Regeneration Failed',
        description: error.message || 'Failed to regenerate image. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

// Hook for regenerating just the voice
export function useRegenerateVoice() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ voicePrompt, bio }: { voicePrompt: string; bio: string }) =>
      api.regenerateVoice(voicePrompt, bio),
    onError: (error: Error) => {
      toast({
        title: 'Voice Regeneration Failed',
        description: error.message || 'Failed to regenerate voice. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

// Hook for saving a profile
export function useSaveProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      bio,
      imageBase64,
      audioBase64,
    }: {
      name: string;
      bio: string;
      imageBase64: string;
      audioBase64: string;
    }) => api.saveProfile(name, bio, imageBase64, audioBase64),
    onSuccess: () => {
      toast({
        title: 'Profile Saved',
        description: 'Identity has been saved to the gallery.',
      });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

// Hook for fetching all saved profiles
export function useProfiles() {
  return useQuery<SavedProfile[]>({
    queryKey: ['profiles'],
    queryFn: () => api.getProfiles(),
  });
}
