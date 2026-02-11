import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, CreditCard, Shield, Ghost, Plus, Copy, Share2 } from 'lucide-react';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

export default function Wallet() {
  const { user } = useAuth();
  const [ghostMode, setGhostMode] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [balance, setBalance] = useState(0.00);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoLink, setPromoLink] = useState('');

  useEffect(() => {
    if (user) {
        fetchSettings();
        fetchWalletData();
        setPromoLink(`${window.location.origin}/register?ref=${user.id}`);
    }
  }, [user]);

  const copyPromoLink = () => {
      navigator.clipboard.writeText(promoLink);
      alert('Promo link copied to clipboard!');
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('profiles').select('ghost_mode, is_verified, is_admin, is_creator').eq('id', user!.id).single();
    if (data) {
        setGhostMode(data.ghost_mode);
        setIsVerified(data.is_verified);
        setIsAdmin(data.is_admin || false);
        setIsCreator(data.is_creator || false);
    }
  };

  const fetchWalletData = async () => {
      // Fetch Balance
      const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user!.id).single();
      if (profile) setBalance(profile.balance || 0);

      // Fetch Transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (txs) setTransactions(txs as Transaction[]);
      setLoading(false);
  };

  const toggleGhostMode = async () => {
    const newValue = !ghostMode;
    setGhostMode(newValue);
    await supabase.from('profiles').update({ ghost_mode: newValue }).eq('id', user!.id);
  };

  const handleDeposit = async () => {
    // Show Venmo instructions
    const amount = prompt("Enter amount to deposit (Min $10):");
    if (!amount || isNaN(Number(amount)) || Number(amount) < 10) {
        alert("Please enter a valid amount (minimum $10).");
        return;
    }

    const confirm = window.confirm(
        `To deposit $${amount}:\n\n` +
        `1. Send $${amount} to @tranzcendx on Venmo.\n` +
        `2. Include your username (${user?.email}) in the payment note.\n\n` +
        `Click OK to open Venmo now.`
    );

    if (confirm) {
        window.open('https://venmo.com/u/tranzcendx', '_blank');
        alert("After sending payment, your balance will be updated within 1-2 hours once an admin verifies it.");
    }
  };

  const handleCashOut = () => {
    const amount = prompt("Enter amount to cash out:");
    if (!amount) return;
    
    // In a real app, this would trigger a backend process
    alert(`Cash out request for $${amount} initiated. \n\nPlease allow 24-48 hours. Funds will be sent to your Venmo.`);
  };

  const handleDeleteAccount = async () => {
      const confirmDelete = prompt("Type 'DELETE' to confirm account deletion. This cannot be undone.");
      if (confirmDelete === 'DELETE') {
          setLoading(true);
          // Call RPC
          const { error } = await supabase.rpc('delete_account');
          if (error) {
              console.error(error);
              alert('Failed to delete account.');
              setLoading(false);
          } else {
              // Sign out and redirect
              await supabase.auth.signOut();
              window.location.href = '/';
          }
      }
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-white">Wallet & Settings</h1>

      {/* Dashboards */}
      <div className="flex flex-col gap-3">
          <div className="flex gap-3">
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 border-none text-white shadow-lg shadow-purple-900/20"
                onClick={() => window.location.href = '/creator-dashboard'}
              >
                  Creator Studio
              </Button>
              <Button 
                className="flex-1 bg-zinc-800 text-white border border-zinc-700"
                onClick={() => window.location.href = '/admin'}
              >
                  Admin Panel
              </Button>
          </div>
      </div>

      {/* Account Status */}
      <div className="flex items-center justify-between rounded-xl bg-surface p-4">
        <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isVerified ? 'bg-blue-500/20 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}>
                <Shield className="h-5 w-5" />
            </div>
            <div>
                <p className="font-medium text-white flex items-center gap-2">
                    Identity Status
                    {isVerified && <VerifiedBadge />}
                </p>
                <p className="text-xs text-zinc-400">{isVerified ? 'Verified Creator' : 'Unverified'}</p>
            </div>
        </div>
        {!isVerified && (
            <Button size="sm" variant="outline">Verify</Button>
        )}
      </div>

      {/* Ghost Mode */}
      <div className="flex items-center justify-between rounded-xl bg-surface p-4">
        <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${ghostMode ? 'bg-purple-500/20 text-purple-500' : 'bg-zinc-800 text-zinc-500'}`}>
                <Ghost className="h-5 w-5" />
            </div>
            <div>
                <p className="font-medium text-white">Ghost Mode</p>
                <p className="text-xs text-zinc-400">Hide from discovery grid</p>
            </div>
        </div>
        <div 
            onClick={toggleGhostMode}
            className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${ghostMode ? 'bg-primary' : 'bg-zinc-700'}`}
        >
            <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${ghostMode ? 'left-6' : 'left-1'}`} />
        </div>
      </div>

      {/* Promo Link */}
      <div className="rounded-xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
            <Share2 className="h-24 w-24 text-white" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                    <Share2 className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-medium text-white">Your Promo Link</p>
                    <p className="text-xs text-zinc-300">Share this to earn referrals</p>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="flex-1 bg-black/30 rounded-lg px-3 py-2 text-sm text-zinc-300 truncate font-mono border border-white/5 select-all">
                    {promoLink}
                </div>
                <Button size="sm" onClick={copyPromoLink} variant="secondary">
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 p-6 border border-white/10">
        <p className="text-sm font-medium text-zinc-400">Total Balance</p>
        <h2 className="mt-2 text-4xl font-bold text-white">${balance.toFixed(2)}</h2>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1 bg-white text-black hover:bg-zinc-200" onClick={handleDeposit}>
             <Plus className="mr-2 h-4 w-4" /> Deposit
          </Button>
          <Button variant="secondary" className="flex-1" onClick={handleCashOut}>
             <ArrowUpRight className="mr-2 h-4 w-4" /> Cash Out
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-white">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">No transactions yet.</p>
          ) : (
            transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl bg-surface p-4">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.amount > 0 ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                    <p className="font-medium text-white capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-white'}`}>
                    {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                </span>
                </div>
            ))
          )}
        </div>
      </div>
      {/* Danger Zone */}
      <div className="mt-8 pt-8 border-t border-zinc-800 space-y-4">
          <h3 className="text-red-500 font-bold mb-4">Danger Zone</h3>
          
          <Button 
            variant="outline" 
            className="w-full text-zinc-400 border-zinc-700 hover:text-white"
            onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/';
            }}
          >
              Sign Out
          </Button>

          <Button 
            variant="ghost" 
            className="w-full border border-red-500/50 text-red-500 hover:bg-red-500/10"
            onClick={handleDeleteAccount}
          >
              Delete Account
          </Button>
      </div>
    </div>
  );
}
