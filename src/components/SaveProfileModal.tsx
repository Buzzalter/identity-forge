import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface SaveProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, bio: string) => void;
  isSaving: boolean;
  defaultBio?: string;
}

export function SaveProfileModal({
  open,
  onOpenChange,
  onSave,
  isSaving,
  defaultBio = '',
}: SaveProfileModalProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  // Auto-fill bio when modal opens
  useEffect(() => {
    if (open) {
      setBio(defaultBio);
    }
  }, [open, defaultBio]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), bio.trim());
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
      setBio('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg border-border/50 glass">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Save Profile</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter a name and customize the bio for this identity profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Profile Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., John Smith - French Diplomat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                disabled={isSaving}
                className="bg-input/50 border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                Biography
              </Label>
              <Textarea
                id="bio"
                placeholder="Enter or edit the biography for this identity..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isSaving}
                className="min-h-[120px] bg-input/50 border-border/50 focus:border-primary/50 transition-colors resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Auto-filled from your description. Edit as needed.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
              className="hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
