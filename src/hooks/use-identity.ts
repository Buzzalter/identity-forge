import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, GeneratedIdentity, SavedProfile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Hook for generating a new identity
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
