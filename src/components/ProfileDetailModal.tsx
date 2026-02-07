import { useState } from 'react';
import { Volume2, Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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

async function fetchAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${url}`);
  return response.blob();
}

function getFileExtension(url: string, defaultExt: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop();
    return ext && ext.length <= 5 ? ext : defaultExt;
  } catch {
    return defaultExt;
  }
}

export function ProfileDetailModal({
  profile,
  open,
  onOpenChange,
}: ProfileDetailModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!profile) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      // Fetch image and audio in parallel
      const [imageBlob, audioBlob] = await Promise.all([
        fetchAsBlob(profile.image_url),
        fetchAsBlob(profile.audio_url),
      ]);

      // Get file extensions
      const imageExt = getFileExtension(profile.image_url, 'png');
      const audioExt = getFileExtension(profile.audio_url, 'mp3');

      // Sanitize profile name for filename
      const safeName = profile.name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();

      // Add files to zip
      zip.file(`${safeName}.${imageExt}`, imageBlob);
      zip.file(`${safeName}.${audioExt}`, audioBlob);

      // Generate and download
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${safeName}.zip`);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle className="text-xl">{profile.name}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
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
