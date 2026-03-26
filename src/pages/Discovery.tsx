import { useEffect, useState } from 'react';
import { Loader2, Compass, Rss, MapPinOff } from 'lucide-react';
import UserCard from '../components/UserCard';
import PostCard from '../components/PostCard';
import { useRandomUsers } from '../hooks/useRandomUsers';
import { useNearbyUsers } from '../hooks/useNearbyUsers';
import { useSocialFeed } from '../hooks/useSocialFeed';

export default function Discovery() {
  const [activeTab, setActiveTab] = useState<'nearby' | 'social'>('nearby');
  const [locationError, setLocationError] = useState<string | null>(null);

  const { profiles: randomProfiles, loading: randomLoading } = useRandomUsers();
  const { profiles: nearbyProfiles, loading: nearbyLoading, fetchNearbyUsers } = useNearbyUsers();
  const { posts, loading: socialLoading } = useSocialFeed();

  const profiles = locationError ? randomProfiles : nearbyProfiles;
  const loading = activeTab === 'nearby' ? (nearbyLoading || (locationError && randomLoading)) : socialLoading;

  useEffect(() => {
    if (activeTab === 'nearby') {
      setLocationError(null);
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        return;
      }

      const geoTimeout = setTimeout(() => {
        setLocationError('Location request timed out.');
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(geoTimeout);
          const { latitude, longitude } = position.coords;
          fetchNearbyUsers(latitude, longitude);
        },
        (error) => {
          clearTimeout(geoTimeout);
          let errorMessage = 'Unable to retrieve your location.';
          if (error.code === 1) errorMessage = 'Location permission denied. Please enable it in browser settings.';
          else if (error.code === 2) errorMessage = 'Location unavailable. Check your GPS/Network.';
          else if (error.code === 3) errorMessage = 'Location request timed out.';
          setLocationError(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => clearTimeout(geoTimeout);
    }
  }, [activeTab, fetchNearbyUsers]);

  return (
    <div className="pb-16">
      {/* Header with Tabs */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-lg border-b border-zinc-800">
        <div className="flex justify-center">
            <button 
                onClick={() => setActiveTab('nearby')} 
                className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'nearby' ? 'text-primary border-b-2 border-primary' : 'text-zinc-400'}`}>
                <Compass className="inline-block mr-2 h-5 w-5"/>
                Nearby
            </button>
            <button 
                onClick={() => setActiveTab('social')} 
                className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'social' ? 'text-primary border-b-2 border-primary' : 'text-zinc-400'}`}>
                <Rss className="inline-block mr-2 h-5 w-5"/>
                Social
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activeTab === 'nearby' ? (
        <>
          {locationError && (
            <div className="m-4 p-4 rounded-lg bg-red-900/50 border border-red-500/30 text-red-300 text-center">
              <MapPinOff className="mx-auto h-8 w-8 mb-2"/>
              <p className="font-semibold">{locationError}</p>
              <p className="text-sm text-red-400">Showing random active users instead.</p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 p-2">
            {profiles.map(profile => (
              <UserCard key={profile.id} profile={profile} />
            ))}
          </div>
        </>
      ) : (
        <div className="p-4 space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
