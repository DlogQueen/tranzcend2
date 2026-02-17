import { Link } from 'react-router-dom';
import { Profile } from '../types';
import { User, Lock, MapPin } from 'lucide-react';
import { VerifiedBadge } from './ui/VerifiedBadge';

interface UserCardProps {
  profile: Profile;
}

export default function UserCard({ profile }: UserCardProps) {
  const isOnline = profile.last_seen && (new Date().getTime() - new Date(profile.last_seen).getTime() < 1000 * 60 * 5); // 5 mins
  
  // Convert dist_meters to miles
  // Note: 'dist_meters' comes from the RPC call
  const distanceMiles = profile.dist_meters 
    ? (profile.dist_meters / 1609.34).toFixed(1) 
    : null;

  return (
    <Link to={`/profile/${profile.id}`} className="group relative block overflow-hidden rounded-xl bg-surface shadow-lg transition-transform hover:scale-[1.02]">
      <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-800">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            <User className="h-16 w-16" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Online Indicator */}
        <div className={`absolute top-3 right-3 h-3 w-3 rounded-full ring-2 ring-surface ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />

        {/* Distance Badge (Top Left) */}
        {distanceMiles && !profile.ghost_mode && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                <MapPin className="h-3 w-3 text-white" />
                {distanceMiles} mi
            </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
             <h3 className="text-lg font-bold text-white shadow-sm">{profile.username}</h3>
             {profile.is_verified && <VerifiedBadge />}
          </div>
          {profile.is_creator && (
             <span className="flex items-center gap-1 rounded-full bg-primary/80 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                <Lock className="h-3 w-3" />
                ${profile.subscription_price}
             </span>
          )}
        </div>
        {profile.bio && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-300 shadow-sm">{profile.bio}</p>
        )}
      </div>
    </Link>
  );
}
