import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import { api, GeneratedIdentity, SavedProfile, GenerationProgress } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'activeGenerationTask';

export function useGenerateIdentityWithProgress() {
  const { toast } = useToast();
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumedResult, setResumedResult] = useState<GeneratedIdentity | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const cleanupStorage = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const startPolling = useCallback((taskId: string, resolve?: (result: GeneratedIdentity) => void, reject?: (error: Error) => void) => {
    setIsGenerating(true);
    setProgress({ status: 'pending', step: 'analyzing', progress: 0, message: 'Resuming generation...' });

    pollingRef.current = setInterval(async () => {
      try {
        const progressData = await api.getProgress(taskId);
        setProgress(progressData);

        if (progressData.status === 'completed') {
          stopPolling();
          const result = await api.getResult(taskId);
          setIsGenerating(false);
          setProgress(null);
          cleanupStorage();
          if (resolve) {
            resolve(result);
          } else {
            setResumedResult(result);
          }
        } else if (progressData.status === 'failed') {
          stopPolling();
          setIsGenerating(false);
          setProgress(null);
          cleanupStorage();
          const err = new Error(progressData.message || 'Generation failed');
          if (reject) {
            reject(err);
          } else {
            toast({
              title: 'Generation Failed',
              description: progressData.message || 'Generation failed',
              variant: 'destructive',
            });
          }
        }
      } catch (err) {
        console.warn('Progress polling error:', err);
      }
    }, 1000);

    // Timeout after 5 minutes
    setTimeout(() => {
      if (pollingRef.current) {
        stopPolling();
        setIsGenerating(false);
        setProgress(null);
        cleanupStorage();
        const err = new Error('Generation timed out');
        if (reject) {
          reject(err);
        }
      }
    }, 300000);
  }, [stopPolling, cleanupStorage, toast]);

  // Resume polling on mount if there's an active task
  useEffect(() => {
    const savedTaskId = sessionStorage.getItem(STORAGE_KEY);
    if (savedTaskId) {
      startPolling(savedTaskId);
    }
    return () => stopPolling();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = useCallback(async (params: { description: string; language: string; accent: string }): Promise<GeneratedIdentity | null> => {
    setIsGenerating(true);
    setProgress({ status: 'pending', step: 'analyzing', progress: 0, message: 'Starting generation...' });

    try {
      const { task_id } = await api.startGeneration(params);
      sessionStorage.setItem(STORAGE_KEY, task_id);

      return new Promise((resolve, reject) => {
        startPolling(task_id, resolve, reject);
      });
    } catch (error) {
      console.log('Falling back to synchronous generation');
      
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
        const result = await api.generateIdentity(params);
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
  }, [startPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setIsGenerating(false);
    setProgress(null);
    cleanupStorage();
  }, [stopPolling, cleanupStorage]);

  return { generate, progress, isGenerating, reset, resumedResult };
}

export function useGenerateIdentity() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: { description: string; language: string; accent: string }) => api.generateIdentity(params),
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate identity. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

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

export function useSaveProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      bio,
      imageBase64,
      audioBase64,
      language,
      accent,
    }: {
      name: string;
      bio: string;
      imageBase64: string;
      audioBase64: string;
      language: string;
      accent: string;
    }) => api.saveProfile(name, bio, imageBase64, audioBase64, language, accent),
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

export function useProfiles() {
  return useQuery<SavedProfile[]>({
    queryKey: ['profiles'],
    queryFn: () => api.getProfiles(),
  });
}
