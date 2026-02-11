import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Camera, Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [locationName, setLocationName] = useState('');
  const [price, setPrice] = useState(0);
  const [identities, setIdentities] = useState<string[]>([]);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const AVAILABLE_IDENTITIES = [
    "Trans Woman", "Trans Man", "Non-Binary", "Genderfluid", 
    "Cis Female", "Cis Male", "Intersex", "Agender", 
    "Two-Spirit", "Queer", "Questioning"
  ];

  const toggleIdentity = (tag: string) => {
    if (identities.includes(tag)) {
      setIdentities(identities.filter(t => t !== tag));
    } else {
      if (identities.length >= 3) return; // Limit to 3 tags
      setIdentities([...identities, tag]);
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
    if (data) {
      setUsername(data.username || '');
      setBio(data.bio || '');
      setWebsite(data.website || '');
      setLocationName(data.location_name || '');
      setPrice(data.subscription_price || 0);
      setIdentities(data.identity_tags || []);
      setAvatarPreview(data.avatar_url);
      setBannerPreview(data.banner_url);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = avatarPreview;
      let bannerUrl = bannerPreview;

      // Upload Avatar
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${user!.id}/avatar_${Date.now()}.${ext}`;
        
        // Use simpler upload first (without upsert initially to test basic permissions)
        const { error: uploadError } = await supabase.storage.from('media').upload(path, avatarFile);
        
        if (uploadError) {
             console.error('Avatar upload error:', uploadError);
             // Fallback: Try 'upsert' if it failed due to duplicate (though timestamp should prevent this)
             const { error: retryError } = await supabase.storage.from('media').upload(path, avatarFile, { upsert: true });
             if (retryError) {
                 alert(`Failed to upload avatar: ${retryError.message}`);
                 setLoading(false);
                 return;
             }
        }
        
        // IMPORTANT: Get public URL manually to ensure it's correct
        // Supabase getPublicUrl is synchronous and just constructs the string
        const { data } = supabase.storage.from('media').getPublicUrl(path);
        
        // Force a cache-bust query param to ensure the browser sees the new image
        avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      }

      // Upload Banner
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const path = `${user!.id}/banner_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(path, bannerFile);

        if (uploadError) {
             console.error('Banner upload error:', uploadError);
             const { error: retryError } = await supabase.storage.from('media').upload(path, bannerFile, { upsert: true });
             if (retryError) {
                 alert(`Failed to upload banner: ${retryError.message}`);
                 setLoading(false);
                 return;
             }
        }
        
        const { data } = supabase.storage.from('media').getPublicUrl(path);
        bannerUrl = `${data.publicUrl}?t=${Date.now()}`;
      }

      // Update Profile
      const { error } = await supabase.from('profiles').update({
        username,
        bio,
        website,
        location_name: locationName,
        subscription_price: price,
        tags: identities, // Map local 'identities' state to DB 'tags' column (or identity_tags if using that schema)
        identity_tags: identities,
        avatar_url: avatarUrl,
        banner_url: bannerUrl
      }).eq('id', user!.id);

      if (error) throw error;
      navigate(`/profile/${user!.id}`);
    } catch (error) {
      console.error(error);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center justify-between">
        <Link to={`/profile/${user?.id}`} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-white">Edit Profile</h1>
        <Button onClick={handleSave} disabled={loading} size="sm" className="bg-purple-600 text-white">
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Banner & Avatar Upload */}
        <div className="relative h-48 bg-zinc-800 group cursor-pointer">
           <img 
             src={bannerPreview || "https://via.placeholder.com/800x300?text=Upload+Banner"} 
             className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition" 
           />
           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
             <ImageIcon className="w-8 h-8 text-white mb-1" />
           </div>
           <input type="file" onChange={(e) => handleFileChange(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer" />
           
           {/* Avatar Overlay */}
           <div className="absolute -bottom-10 left-4 w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-zinc-700 group/avatar cursor-pointer">
              <img src={avatarPreview || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input type="file" onChange={(e) => handleFileChange(e, 'avatar')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
           </div>
        </div>

        <div className="px-6 pt-12 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase">Display Name</label>
            <input 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase">Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none resize-none" 
              placeholder="Tell your story..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase">Website</label>
            <input 
              value={website} 
              onChange={e => setWebsite(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none" 
              placeholder="https://onlyfans.com/..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase">Location</label>
            <input 
              value={locationName} 
              onChange={e => setLocationName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none" 
              placeholder="City, Country"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase">Subscription Price ($)</label>
            <input 
              type="number"
              value={price} 
              onChange={e => setPrice(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none" 
            />
            <p className="text-xs text-zinc-500">Set to 0 for free profile.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-400 uppercase">Identity Tags (Max 3)</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_IDENTITIES.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleIdentity(tag)}
                  className={`px-4 py-2 rounded-full text-sm border transition ${
                    identities.includes(tag) 
                      ? 'bg-purple-600 border-purple-600 text-white' 
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
