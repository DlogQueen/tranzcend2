import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Users, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Group {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*, members:group_members(count)');

    if (error) {
      console.error('Error fetching groups:', error);
    } else {
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
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id });
    if (!error) {
      alert('Joined group!');
      fetchGroups();
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Groups</h1>
        <Link to="/groups/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Group</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {groups.map(group => (
          <div key={group.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-white">{group.name}</h2>
              <p className="text-sm text-zinc-400">{group.description}</p>
              <p className="text-xs text-zinc-500 mt-2 flex items-center"><Users className="mr-1 h-3 w-3" /> {group.member_count} members</p>
            </div>
            <Button variant="secondary" onClick={() => handleJoinGroup(group.id)}>Join</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
