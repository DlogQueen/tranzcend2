import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Post } from '../types';

export function useSocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSocialFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setPosts(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching social feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocialFeed();
  }, [fetchSocialFeed]);

  return { posts, loading, error, refetch: fetchSocialFeed };
}
