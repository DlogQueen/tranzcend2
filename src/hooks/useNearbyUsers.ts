import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { useAuth } from './useAuth';

export function useNearbyUsers() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyUsers = useCallback(async (lat: number, long: number) => {
    setLoading(true);
    setError(null);

    try {
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
        radius_meters: 25 * 1609.34
      });

      if (error) throw error;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).getTime();
      const filtered = (data as Profile[]).filter(p => {
        if (p.id === user?.id) return false;
        const lastSeen = p.last_seen ? new Date(p.last_seen).getTime() : 0;
        return lastSeen > oneHourAgo;
      });

      setProfiles(filtered);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { profiles, loading, error, fetchNearbyUsers };
}
