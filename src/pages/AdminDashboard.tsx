import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Users, DollarSign, ShieldCheck, Check, X, ShieldAlert, UserPlus, Radio, CreditCard, Crown, Wifi, Clock, Search, Ban } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

interface CreatorRequestWithEmail {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
  email: string;
}

interface VerificationRequest {
  id: string;
  full_legal_name: string;
  id_document_url: string;
  selfie_with_id_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
}

interface LiveStream {
  id: string;
  creator_id: string;
  show_type: string;
  viewer_count: number;
  started_at: string;
  profiles: { username: string; avatar_url: string; is_founding_creator: boolean; revenue_split: number };
}

interface Member {
  id: string;
  username: string;
  avatar_url: string;
  is_creator: boolean;
  is_verified: boolean;
  is_premium: boolean;
  is_founding_creator: boolean;
  is_admin: boolean;
  balance: number;
  last_seen: string;
  created_at: string;
  revenue_split: number;
}

const inputCls = "w-full bg-zinc-900 border border-teal-500/40 rounded-lg p-3 text-white placeholder-zinc-500 focus:border-teal-400 outline-none";

const isOnline = (lastSeen: string) => lastSeen && new Date(lastSeen) > new Date(Date.now() - 5 * 60 * 1000);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [creatorRequests, setCreatorRequests] = useState<CreatorRequestWithEmail[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'online' | 'creators' | 'premium'>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'live' | 'creators' | 'verifications' | 'slots'>('overview');
  const [slotPrice, setSlotPrice] = useState(15);
  const [slots, setSlots] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    const { data: purchases } = await supabase.from('transactions').select('amount').eq('type', 'purchase');
    const gross = purchases?.reduce((s, t) => s + Math.abs(t.amount), 0) || 0;
    setTotalRevenue(gross * 0.20);
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    setTotalUsers(count || 0);
    // Online = last seen within 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: online } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen', fiveMinAgo);
    setOnlineCount(online || 0);
  }, []);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, is_creator, is_verified, is_premium, is_founding_creator, is_admin, balance, last_seen, created_at, revenue_split')
      .order('last_seen', { ascending: false })
      .limit(100);
    setMembers((data || []) as Member[]);
  }, []);

  const fetchLiveStreams = useCallback(async () => {
    const { data } = await supabase
      .from('live_streams')
      .select('*, profiles:creator_id(username, avatar_url, is_founding_creator, revenue_split)')
      .eq('status', 'live');
    setLiveStreams((data || []) as unknown as LiveStream[]);
  }, []);

  const fetchRequests = useCallback(async () => {
    const { data: verifData } = await supabase.from('verification_requests').select('*').eq('status', 'pending');
    if (verifData) setRequests(verifData as VerificationRequest[]);
    const { data: creatorData } = await supabase.rpc('get_creator_requests_with_details');
    setCreatorRequests(creatorData || []);
    const { data: slotData } = await supabase.from('slot_rentals').select('*, profiles:user_id(username)').eq('is_active', true);
    setSlots(slotData || []);
    setLoading(false);
  }, []);

  const checkAdmin = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (data?.is_admin) {
      setIsAdmin(true);
      fetchRequests();
      fetchStats();
      fetchLiveStreams();
      fetchMembers();
    } else {
      setLoading(false);
    }
  }, [user, fetchRequests, fetchStats, fetchLiveStreams, fetchMembers]);

  useEffect(() => { checkAdmin(); }, [checkAdmin]);

  // Real-time live stream updates
  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase.channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, fetchLiveStreams)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchStats)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, fetchLiveStreams, fetchStats]);

  const handleCreatorDecision = async (userId: string, decision: 'approved' | 'rejected') => {
    await supabase.from('profiles').update({
      is_creator: decision === 'approved',
      creator_request_pending: false
    }).eq('id', userId);
    setCreatorRequests(prev => prev.filter(r => r.id !== userId));
  };

  const handleVerifDecision = async (id: string, decision: 'approved' | 'rejected') => {
    await supabase.from('verification_requests').update({ status: decision }).eq('id', id);
    if (decision === 'approved') {
      const req = requests.find(r => r.id === id);
      if (req) await supabase.from('profiles').update({ is_verified: true, is_creator: true }).eq('id', req.user_id);
    }
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const setFoundingCreator = async (userId: string) => {
    await supabase.from('profiles').update({ is_founding_creator: true, revenue_split: 1.0 }).eq('id', userId);
    alert('Set as founding creator - keeps 100% forever!');
  };

  const endStream = async (streamId: string) => {
    if (!confirm('End this stream?')) return;
    await supabase.from('live_streams').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', streamId);
    fetchLiveStreams();
  };

  const createSlot = async () => {
    await supabase.from('slot_rentals').insert({ price_per_month: slotPrice, is_active: true });
    fetchRequests();
    alert(`Slot created at $${slotPrice}/month`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm">Loading admin panel...</p>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-zinc-400 mb-8 max-w-sm">You don't have admin access to this panel.</p>
        <button
          onClick={async () => { await supabase.rpc('claim_admin_access'); window.location.reload(); }}
          className="text-xs text-zinc-700 hover:text-zinc-500 border border-dashed border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-colors"
        >
          [DEV] Claim Admin Access
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'live', label: `Live (${liveStreams.length})` },
    { id: 'creators', label: `Creators (${creatorRequests.length})` },
    { id: 'verifications', label: `Verify (${requests.length})` },
    { id: 'slots', label: 'Slots' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/40 via-zinc-900 to-teal-900/40 border-b border-white/5 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-teal-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-zinc-500">Tranzcend X Platform Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveStreams.length > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-red-400">{liveStreams.length} LIVE</span>
              </div>
            )}
            <div className="bg-zinc-900 border border-teal-500/30 px-4 py-2 rounded-xl">
              <p className="text-xs text-teal-400 font-bold uppercase">Revenue</p>
              <p className="text-lg font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Users, label: 'Total Users', value: totalUsers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: DollarSign, label: 'Platform Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'text-green-400', bg: 'bg-green-500/10' },
            { icon: Radio, label: 'Live Now', value: liveStreams.length, color: 'text-red-400', bg: 'bg-red-500/10' },
            { icon: ShieldCheck, label: 'Pending', value: requests.length + creatorRequests.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors">
                <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-lg'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} title="Total Users" value={totalUsers} />
          <StatCard icon={DollarSign} title="Platform Revenue" value={`$${totalRevenue.toFixed(2)}`} />
          <StatCard icon={Radio} title="Live Now" value={liveStreams.length} />
          <StatCard icon={ShieldCheck} title="Pending Verifs" value={requests.length} />
        </div>
      )}

      {/* LIVE STREAMS */}
      {activeTab === 'live' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="font-bold text-white">Live Streams ({liveStreams.length})</h2>
          </div>
          {liveStreams.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">No one is live right now.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {liveStreams.map(stream => (
                <div key={stream.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={stream.profiles?.avatar_url || ''} className="w-10 h-10 rounded-full object-cover bg-zinc-700" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{stream.profiles?.username}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="capitalize">{stream.show_type} show</span>
                        <span>·</span>
                        <span>{stream.viewer_count || 0} viewers</span>
                        <span>·</span>
                        <span>{Math.round((Date.now() - new Date(stream.started_at).getTime()) / 60000)}m</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${stream.profiles?.is_founding_creator ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {stream.profiles?.is_founding_creator ? '⭐ Founding' : `${Math.round((stream.profiles?.revenue_split || 0.8) * 100)}% split`}
                    </span>
                    <Button onClick={() => endStream(stream.id)} variant="outline" className="text-red-400 border-red-900/50 text-xs">
                      End Stream
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATOR REQUESTS */}
      {activeTab === 'creators' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">Creator Access Requests ({creatorRequests.length})</h2>
          </div>
          {creatorRequests.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">No pending requests.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {creatorRequests.map(req => (
                <div key={req.id} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={req.avatar_url || ''} className="w-10 h-10 rounded-full bg-zinc-700 object-cover" />
                    <div>
                      <p className="font-medium text-white">{req.username}</p>
                      <p className="text-xs text-zinc-400">{req.email}</p>
                      <p className="text-xs text-zinc-500">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => setFoundingCreator(req.id)} variant="outline" className="text-yellow-400 border-yellow-900/50 text-xs">
                      ⭐ Set Founding (100%)
                    </Button>
                    <Button onClick={() => handleCreatorDecision(req.id, 'rejected')} variant="outline" className="text-red-400 border-red-900/50 text-xs">
                      <X className="w-3 h-3 mr-1" /> Reject
                    </Button>
                    <Button onClick={() => handleCreatorDecision(req.id, 'approved')} className="bg-purple-600 hover:bg-purple-700 text-xs">
                      <UserPlus className="w-3 h-3 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VERIFICATIONS */}
      {activeTab === 'verifications' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">ID Verifications ({requests.length})</h2>
          </div>
          {requests.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">No pending verifications.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {requests.map(req => (
                <div key={req.id} className="p-4 flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-white">{req.full_legal_name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{req.user_id}</p>
                    <p className="text-xs text-zinc-500">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-3">
                    <a href={req.id_document_url} target="_blank" rel="noopener noreferrer">
                      <img src={req.id_document_url} alt="ID" className="w-28 h-18 rounded object-cover border border-zinc-700 hover:border-teal-500" />
                    </a>
                    <a href={req.selfie_with_id_url} target="_blank" rel="noopener noreferrer">
                      <img src={req.selfie_with_id_url} alt="Selfie" className="w-28 h-18 rounded object-cover border border-zinc-700 hover:border-teal-500" />
                    </a>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => handleVerifDecision(req.id, 'rejected')} variant="outline" className="text-red-400 border-red-900/50 text-xs">
                      <X className="w-3 h-3 mr-1" /> Reject
                    </Button>
                    <Button onClick={() => handleVerifDecision(req.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-xs">
                      <Check className="w-3 h-3 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SLOT RENTALS */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-teal-500/30 rounded-xl p-6">
            <h2 className="font-bold text-white mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-400" /> Creator Slot Rentals
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Rent streaming slots to creators for a flat monthly fee. They keep 100% of earnings, you get guaranteed income regardless of their performance.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[10, 15, 20].map(price => (
                <div key={price} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${slotPrice === price ? 'border-teal-400 bg-teal-400/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}`}
                  onClick={() => setSlotPrice(price)}>
                  <p className="text-2xl font-bold text-white">${price}<span className="text-sm text-zinc-400">/mo</span></p>
                  <p className="text-xs text-zinc-400 mt-1">{price === 10 ? 'Entry level' : price === 15 ? 'Standard ⭐' : 'Premium'}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type="number"
                value={slotPrice}
                onChange={e => setSlotPrice(Number(e.target.value))}
                className={inputCls + ' max-w-xs'}
                placeholder="Custom price"
              />
              <Button onClick={createSlot} className="bg-teal-600 hover:bg-teal-700">
                Create Slot
              </Button>
            </div>
          </div>

          {/* Active Slots */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="font-bold text-white">Active Slots ({slots.length})</h3>
            </div>
            {slots.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No active slots yet. Create one above.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {slots.map((slot: any) => (
                  <div key={slot.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{slot.profiles?.username || 'Unassigned'}</p>
                      <p className="text-xs text-zinc-400">${slot.price_per_month}/month</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
