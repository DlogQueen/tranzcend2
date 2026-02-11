import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import UserCard from '../components/UserCard';
import { Loader2, MapPinOff } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Discovery() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState(30); // Default 30 miles

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    // Add a timeout to geolocation
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
  }, []);

  const fetchNearbyUsers = async (lat: number, long: number) => {
    try {
      setLoading(true);
      
      // Update current user's location first (optional but good for discovery)
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

      // Call RPC function
      const { data, error } = await supabase.rpc('get_nearby_users', {
        lat,
        long,
        radius_meters: radius * 1609.34 // Convert miles to meters
      });

      if (error) throw error;
      
      // Filter out current user AND users in Ghost Mode
      const filtered = (data as Profile[]).filter(p => 
        p.id !== user?.id && !p.ghost_mode
      );
      setProfiles(filtered);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Fallback
      fetchRandomUsers();
    } finally {
      setLoading(false);
    }
  };

  const fetchRandomUsers = async () => {
     setLoading(true);
     const { data, error } = await supabase.from('profiles').select('*').limit(20);
     if (!error && data) {
         setProfiles(data as Profile[]);
     }
     setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-20">
      <header className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
        <h1 className="text-2xl font-bold text-white">Discover</h1>
        <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{radius} mi</span>
            <input 
                type="range" 
                min="5" 
                max="300" 
                step="5"
                value={radius} 
                onChange={(e) => setRadius(Number(e.target.value))}
                onMouseUp={() => window.location.reload()} // Simple reload to re-fetch for MVP
                className="w-24 accent-purple-500"
            />
        </div>
      </header>

      {locationError && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-500">
           <MapPinOff className="h-4 w-4" />
           {locationError}
           <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="ml-auto">Retry</Button>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 text-center text-zinc-500">
          <p>No users found nearby.</p>
          <p className="text-sm">Try expanding your search radius.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {profiles.map((profile) => (
            <UserCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
