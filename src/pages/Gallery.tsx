import { useState } from 'react';
import { Grid3X3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/MainLayout';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileDetailModal } from '@/components/ProfileDetailModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useProfiles } from '@/hooks/use-identity';
import { SavedProfile } from '@/lib/api';

export default function Gallery() {
  const { data: profiles, isLoading, isError, refetch, isFetching } = useProfiles();
  const [selectedProfile, setSelectedProfile] = useState<SavedProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCardClick = (profile: SavedProfile) => {
    setSelectedProfile(profile);
    setModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage saved identity profiles
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" text="Loading profiles..." />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Grid3X3 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium">Failed to load profiles</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Make sure the backend server is running at localhost:8000
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : profiles && profiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {profiles.map((profile, index) => (
              <ProfileCard
                key={`${profile.name}-${index}`}
                profile={profile}
                onClick={() => handleCardClick(profile)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Grid3X3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No profiles yet</h3>
            <p className="text-muted-foreground mt-1">
              Generate and save identities to see them here
            </p>
          </div>
        )}
      </div>

      <ProfileDetailModal
        profile={selectedProfile}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </MainLayout>
  );
}
