import { SavedProfile } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  profile: SavedProfile;
  onClick: () => void;
}

export function ProfileCard({ profile, onClick }: ProfileCardProps) {
  // Get a short snippet of the bio
  const bioSnippet = profile.bio.length > 80 
    ? profile.bio.slice(0, 80) + '...' 
    : profile.bio;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative aspect-square rounded-lg overflow-hidden',
        'bg-muted transition-all duration-300',
        'hover:ring-2 hover:ring-primary/50 hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary'
      )}
    >
      {/* Image */}
      <img
        src={profile.image_url}
        alt={profile.name}
        className={cn(
          'w-full h-full object-cover',
          'transition-all duration-300',
          'group-hover:scale-105 group-hover:brightness-50'
        )}
      />

      {/* Overlay */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end p-4',
          'bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent',
          'opacity-0 transition-opacity duration-300',
          'group-hover:opacity-100'
        )}
      >
        <h3 className="text-primary-foreground font-semibold text-lg leading-tight">
          {profile.name}
        </h3>
        <p className="text-primary-foreground/80 text-sm mt-1 line-clamp-2">
          {bioSnippet}
        </p>
      </div>
    </button>
  );
}
