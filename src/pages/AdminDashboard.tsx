import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Users, DollarSign, ShieldCheck, Check, X, ShieldAlert, UserPlus, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';

import { Profile } from '../types';

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [creatorRequests, setCreatorRequests] = useState<CreatorRequestWithEmail[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Real-time stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchStats = useCallback(async () => {
      // 1. Total Revenue (Platform Fee is 20% of all purchase transactions)
      const { data: purchases } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'purchase');
      
      const grossVolume = purchases?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;
      setTotalRevenue(grossVolume * 0.20); // 20% platform fee

      // 2. Total Users (Real-time count)
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setTotalUsers(userCount || 0);
  }, []);

  // Subscribe to realtime changes for instant updates
  useEffect(() => {
    if (!isAdmin) return;

    const subscription = supabase
      .channel('admin-dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAdmin, fetchStats]);

  const fetchRequests = useCallback(async () => {
    // 1. Fetch Verification Requests
    const { data: verifData } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('status', 'pending');
    if (verifData) setRequests(verifData as VerificationRequest[]);

    // 2. Fetch Creator Access Requests
    const { data: creatorData, error: creatorError } = await supabase.rpc('get_creator_requests_with_details');
    
    if (creatorError) {
      console.error('Error fetching creator requests:', creatorError.message);
      alert("Could not fetch creator requests. This may be because the required database function 'get_creator_requests_with_details' is missing. I will provide the SQL code to create it shortly.");
    } else {
      setCreatorRequests(creatorData || []);
    }
    
    setLoading(false);
  }, []);

  const checkAdmin = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (data?.is_admin) {
      setIsAdmin(true);
      fetchRequests();
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user, fetchRequests, fetchStats]);

  useEffect(() => {
    checkAdmin();
  }, [user, checkAdmin]);

  const handleCreatorDecision = async (userId: string, decision: 'approved' | 'rejected') => {
      // 1. Update Request
      await supabase.from('profiles').update({ 
        is_creator: decision === 'approved',
        creator_request_pending: false 
      }).eq('id', userId);

      // 2. Update UI
      setCreatorRequests(prev => prev.filter(r => r.id !== userId));
  };

  // ... existing handleDecision ...


  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    // 1. Update Request Status
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: decision })
      .eq('id', id);

    if (error) {
      alert('Error updating request');
      return;
    }

    // 2. If approved, update user profile
    if (decision === 'approved') {
      const request = requests.find(r => r.id === id);
      if (request) {
        await supabase
          .from('profiles')
          .update({ is_creator: true, is_verified: true })
          .eq('id', request.user_id);
      }
    }

    // 3. Remove from local state
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  if (loading) return <div className="p-10 text-center text-white">Loading admin panel...</div>;

  const claimAdmin = async () => {
    try {
      const { error } = await supabase.rpc('claim_admin_access');
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      console.error('Error claiming admin:', error);
      alert('Failed to claim admin access.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-zinc-400 mb-6">You do not have permission to view this page.</p>
        
        <Button 
          onClick={claimAdmin}
          variant="outline"
          className="opacity-50 hover:opacity-100 text-xs border-dashed border-zinc-700"
        >
          [DEV] Claim Admin Access
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400">Platform Management & Verification</p>
          </div>
          <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
              <span className="text-xs text-zinc-500 uppercase font-bold block">Total Revenue (20%)</span>
              <span className="text-xl font-bold text-green-400">${totalRevenue.toFixed(2)}</span>
          </div>
      </header>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} title="Total Users" value={totalUsers} />
          <StatCard icon={DollarSign} title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
          <StatCard icon={ShieldCheck} title="Verification Requests" value={requests.length} />
          <Link to="/creator-requests">
            <StatCard icon={UserCheck} title="Creator Requests" value={creatorRequests.length} />
          </Link>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Creator Access Requests ({creatorRequests.length})</h2>
        </div>

        <div className="divide-y divide-zinc-800">
          {creatorRequests.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No pending creator requests.
            </div>
          ) : (
            creatorRequests.map((req) => (
              <div key={req.id} className="p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">Username:</span>
                    <span className="text-white font-medium">{req.username || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">Email:</span>
                    <span className="text-zinc-300">{req.email || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">Requested:</span>
                    <span className="text-zinc-500 text-sm">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => handleCreatorDecision(req.id, 'rejected')}
                    variant="outline" 
                    className="text-red-400 border-red-900/50 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button 
                    onClick={() => handleCreatorDecision(req.id, 'approved')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Grant Access
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Pending Verifications ({requests.length})</h2>
        </div>

        <div className="divide-y divide-zinc-800">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No pending requests.
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">Legal Name:</span>
                    <span className="text-white font-medium">{req.full_legal_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">User ID:</span>
                    <span className="text-zinc-500 text-xs font-mono">{req.user_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">Submitted:</span>
                    <span className="text-zinc-500 text-sm">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Document Previews (Protected Images) */}
                <div className="flex gap-4">
                   <a href={req.id_document_url} target="_blank" rel="noopener noreferrer">
                       <img src={req.id_document_url} alt="ID Document" className="w-32 h-20 bg-zinc-800 rounded object-cover border border-zinc-700" />
                   </a>
                   <a href={req.selfie_with_id_url} target="_blank" rel="noopener noreferrer">
                       <img src={req.selfie_with_id_url} alt="Selfie" className="w-32 h-20 bg-zinc-800 rounded object-cover border border-zinc-700" />
                   </a>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => handleDecision(req.id, 'rejected')}
                    variant="outline" 
                    className="text-red-400 border-red-900/50 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button 
                    onClick={() => handleDecision(req.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
