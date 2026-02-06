import { X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SavedProfile } from '@/lib/api';

interface ProfileDetailModalProps {
  profile: SavedProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDetailModal({
  profile,
  open,
  onOpenChange,
}: ProfileDetailModalProps) {
  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{profile.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 py-4">
          {/* Image */}
          <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
            <img
              src={profile.image_url}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Biography
              </h3>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Voice Sample
              </h3>
              <audio
                controls
                className="w-full h-10"
                src={profile.audio_url}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
