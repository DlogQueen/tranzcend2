import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Check, X, Eye, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (data?.is_admin) {
      setIsAdmin(true);
      fetchRequests();
    } else {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) console.error(error);
    if (data) setRequests(data as VerificationRequest[]);
    setLoading(false);
  };

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
              <span className="text-xs text-zinc-500 uppercase font-bold block">Total Revenue</span>
              <span className="text-xl font-bold text-green-400">$45,230.00</span>
          </div>
      </header>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-zinc-400 text-xs uppercase font-bold mb-1">Total Users</h3>
              <p className="text-2xl font-bold text-white">12,450</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-zinc-400 text-xs uppercase font-bold mb-1">Active Creators</h3>
              <p className="text-2xl font-bold text-purple-400">840</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-zinc-400 text-xs uppercase font-bold mb-1">Pending Verifications</h3>
              <p className="text-2xl font-bold text-yellow-400">{requests.length}</p>
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
                   {/* In a real app, we would generate signed URLs here. 
                       For now, assuming we have access or using a placeholder flow */}
                   <div className="w-32 h-20 bg-zinc-800 rounded flex items-center justify-center border border-zinc-700">
                      <span className="text-xs text-zinc-500">ID Doc</span>
                   </div>
                   <div className="w-32 h-20 bg-zinc-800 rounded flex items-center justify-center border border-zinc-700">
                      <span className="text-xs text-zinc-500">Selfie</span>
                   </div>
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
