import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export function useRandomUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(50);
      if (error) throw error;

      if (data) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).getTime();
        const filtered = (data as Profile[]).filter(p => {
          const lastSeen = p.last_seen ? new Date(p.last_seen).getTime() : 0;
          return lastSeen > oneHourAgo;
        });
        setProfiles(filtered);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRandomUsers();
  }, [fetchRandomUsers]);

  return { profiles, loading, error, refetch: fetchRandomUsers };
}
