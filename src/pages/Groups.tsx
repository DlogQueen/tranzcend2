import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Users, Plus, ArrowLeft, X } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Group {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('group_chats')
      .select('*, members:group_chat_members(count)')
      .eq('is_active', true);

    if (!error && data) {
      const formattedGroups = data.map(g => ({ ...g, member_count: g.members[0]?.count || 0 }));
      setGroups(formattedGroups as unknown as Group[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('group_chat_members')
      .insert({ group_id: groupId, user_id: user.id });
    if (!error) {
      alert('Joined group!');
      fetchGroups();
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroup.name.trim()) return;
    setCreating(true);

    const { error } = await supabase.from('group_chats').insert({
      creator_id: user.id,
      name: newGroup.name.trim(),
      description: newGroup.description.trim(),
      is_active: true
    });

    if (!error) {
      setShowCreate(false);
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } else {
      alert('Failed to create group');
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-white flex-1">Groups</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No groups yet</p>
            <p className="text-sm mt-1">Create the first one!</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-white">{group.name}</h2>
                <p className="text-sm text-zinc-400">{group.description}</p>
                <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                  <Users className="h-3 w-3" /> {group.member_count} members
                </p>
              </div>
              <Button variant="secondary" onClick={() => handleJoinGroup(group.id)}>Join</Button>
            </div>
          ))
        )}
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create Group</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Group Name</label>
                <input
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., VIP Members, Fan Club..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(p => ({ ...p, description: e.target.value }))}
                  placeholder="What's this group about?"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-purple-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleCreateGroup}
                disabled={creating || !newGroup.name.trim()}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
