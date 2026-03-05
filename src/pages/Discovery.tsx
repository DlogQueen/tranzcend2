import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Post } from '../types';
import UserCard from '../components/UserCard';
import { Loader2, Compass, Users, Search, Rss, MapPinOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import PostCard from '../components/PostCard';

export default function Discovery() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState(25); // Default radius in miles
  const [activeTab, setActiveTab] = useState<'nearby' | 'social'>('nearby');

  const fetchRandomUsers = useCallback(async () => {
     setLoading(true);
     const { data, error } = await supabase.from('profiles').select('*').limit(50);
     if (!error && data) {
         const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).getTime();
         const filtered = (data as Profile[]).filter(p => {
             const lastSeen = p.last_seen ? new Date(p.last_seen).getTime() : 0;
             return lastSeen > oneHourAgo;
         });
         setProfiles(filtered);
     }
     setLoading(false);
  }, []);

  const fetchNearbyUsers = useCallback(async (lat: number, long: number) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
            .from('profiles')
            .update({ 
                location: `POINT(${long} ${lat})`,
                last_seen: new Date().toISOString()
            })
            .eq('id', user.id);
      }

      const { data, error } = await supabase.rpc('get_nearby_users', {
        lat,
        long,
        radius_meters: radius * 1609.34 // Convert miles to meters
      });

      if (error) throw error;
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).getTime();
      
      const filtered = (data as Profile[]).filter(p => {
        if (p.id === user?.id) return false;
        
        const lastSeen = p.last_seen ? new Date(p.last_seen).getTime() : 0;
        if (lastSeen < oneHourAgo) return false;

        return true;
      });
      setProfiles(filtered);
    } catch (err) {
      console.error('Error fetching users:', err);
      fetchRandomUsers();
    } finally {
      setLoading(false);
    }
  }, [radius, fetchRandomUsers]);

  const fetchSocialFeed = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching social feed:', error);
    } else {
      setPosts((data as any) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'nearby') {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        setLoading(false);
        return;
      }

      const geoTimeout = setTimeout(() => {
          if (loading) {
              console.warn('Geolocation timed out, falling back to random users');
              setLocationError('Location request timed out.');
              fetchRandomUsers();
          }
      }, 10000); // 10 seconds timeout

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(geoTimeout);
          const { latitude, longitude } = position.coords;
          await fetchNearbyUsers(latitude, longitude);
        },
        (error) => {
          clearTimeout(geoTimeout);
          console.error('Error getting location:', error);
          
          let errorMessage = 'Unable to retrieve your location.';
          if (error.code === 1) errorMessage = 'Location permission denied. Please enable it in browser settings.';
          else if (error.code === 2) errorMessage = 'Location unavailable. Check your GPS/Network.';
          else if (error.code === 3) errorMessage = 'Location request timed out.';
          
          setLocationError(errorMessage);
          fetchRandomUsers(); 
        },
        { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
        }
      );
      
      return () => clearTimeout(geoTimeout);
    } else {
      fetchSocialFeed();
    }
  }, [activeTab, fetchNearbyUsers, fetchRandomUsers, fetchSocialFeed]);

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
