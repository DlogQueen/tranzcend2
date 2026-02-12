import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Post, Profile } from '../types';
import PostCard from '../components/PostCard';
import { Loader2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    
    // Improved Feed Query:
    // 1. Fetches posts
    // 2. Joins 'profiles' data automatically to avoid N+1 problem
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles:user_id (*)') // Join user profile data
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) console.error(error);
    
    if (data) {
        // Map the joined data to our Post type
        // Note: We need to handle the fact that 'profiles' comes back as an object or array
        const formattedPosts = data.map((post: any) => ({
            ...post,
            creator: post.profiles // Pass the joined profile down
        }));
        setPosts(formattedPosts);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex justify-center pt-20">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  return (
    <div className="pb-20 max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Feed</h1>
        <Link to="/create-post">
            <button className="bg-gradient-to-r from-purple-600 to-teal-600 text-white p-2 rounded-full shadow-lg hover:scale-105 transition">
                <Plus className="w-6 h-6" />
            </button>
        </Link>
      </div>

      <div className="space-y-6">
        {posts.map((post: any) => (
          <PostCard key={post.id} post={post} creator={post.creator} />
        ))}
        {posts.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
                <p>No posts yet.</p>
                <p className="text-sm">Be the first to post!</p>
            </div>
        )}
      </div>
    </div>
  );
}
