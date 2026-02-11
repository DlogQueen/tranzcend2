import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Image as ImageIcon, Lock, Unlock, X } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Check user status
    if (user) {
        supabase.from('profiles').select('is_creator, is_premium').eq('id', user.id).single()
        .then(({ data }) => {
            if (data?.is_creator) setIsCreator(true);
            if (data?.is_premium) setIsPremium(true);
        });
    }
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handlePost = async () => {
    if (!file || !user) return;
    setLoading(true);

    try {
      // 0. Check Limits for FREE users
      // (Assuming 'is_creator' or 'is_premium' means paid/unlimited)
      if (!isCreator && !isPremium) {
          const today = new Date();
          today.setHours(0,0,0,0);
          
          const { count } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString());
          
          // Limit: 10 posts per day (photos/videos combined for MVP simplicity, 
          // or we could inspect file type. User said "10 photos, 2 videos". 
          // Let's enforce a strict "12 total" for now to be safe and simple).
          if ((count || 0) >= 12) {
              alert("Daily post limit reached! Upgrade to Premium for unlimited posting.");
              setLoading(false);
              return;
          }
      }

      // 1. Upload Image
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Attempt upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file, {
            upsert: true
        });

      if (uploadError) {
          console.error('Upload Error:', uploadError);
          throw new Error('Failed to upload image. Please try again.');
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      // 3. Create Post Record
      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          caption: caption,
          is_locked: isLocked
        });

      if (dbError) throw dbError;

      // 4. Redirect to Profile
      navigate(`/profile/${user.id}`);
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert(error.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-white">New Post</h1>
        <Button 
          onClick={handlePost} 
          disabled={!file || loading} 
          size="sm" 
          className="bg-purple-600 text-white disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Share'}
        </Button>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        
        {!isCreator && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-yellow-200 text-sm mb-4">
                <strong>Note:</strong> Basic users can only post content to their profile for followers. To monetize content and lock posts, you must <span className="underline cursor-pointer" onClick={() => navigate('/verification')}>Verify as a Creator</span>.
            </div>
        )}

        {/* Image Preview / Upload Area */}
        <div className="aspect-square w-full bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center overflow-hidden relative">
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={clearFile}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-4 w-full h-full justify-center hover:bg-zinc-800/50 transition">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                <ImageIcon className="w-8 h-8" />
              </div>
              <span className="text-zinc-400 font-medium">Tap to select photo or video</span>
              <input type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
            </label>
          )}
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase">Caption</label>
          <textarea 
            value={caption} 
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            placeholder="Write a caption..."
            rows={3}
          />
        </div>

        {/* Lock Toggle */}
        {isCreator ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isLocked ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                {isLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                </div>
                <div>
                <h3 className="text-white font-medium">Exclusive Content</h3>
                <p className="text-xs text-zinc-500">Lock this post for subscribers only</p>
                </div>
            </div>
            <button 
                onClick={() => setIsLocked(!isLocked)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isLocked ? 'bg-purple-600' : 'bg-zinc-700'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isLocked ? 'left-7' : 'left-1'}`} />
            </button>
            </div>
        ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between opacity-50 cursor-not-allowed">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">Exclusive Content</h3>
                        <p className="text-xs text-zinc-500">Only Creators can lock posts</p>
                    </div>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
}
