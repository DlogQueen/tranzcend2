import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Lock, Zap, Crown, Star } from 'lucide-react';
import { Button } from './ui/Button';

interface StreamPaywallProps {
  streamId: string;
  creatorName: string;
  onUnlocked: () => void;
}

const PREVIEW_SECONDS = 120; // 2 minutes

export default function StreamPaywall({ streamId, creatorName, onUnlocked }: StreamPaywallProps) {
  const { user } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(PREVIEW_SECONDS);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Check if user already has access
  useEffect(() => {
    if (!user) return;
    const checkAccess = async () => {
      const { data } = await supabase
        .from('stream_access')
        .select('id')
        .eq('stream_id', streamId)
        .eq('user_id', user.id)
        .single();
      if (data) { setHasAccess(true); onUnlocked(); }
    };
    checkAccess();
  }, [user, streamId, onUnlocked]);

  // 2-minute countdown
  useEffect(() => {
    if (hasAccess) return;
    if (secondsLeft <= 0) { setShowPaywall(true); return; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, hasAccess]);

  const handlePay = async (plan: 'day' | 'month') => {
    if (!user) return;
    setLoading(true);

    const price = plan === 'day' ? 2.95 : 9.95;

    // Check balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (!profile || profile.balance < price) {
      alert(`Insufficient balance. Please deposit funds in your wallet.`);
      setLoading(false);
      return;
    }

    // Deduct balance
    await supabase.from('profiles')
      .update({ balance: profile.balance - price })
      .eq('id', user.id);

    // Grant access
    const expiresAt = new Date();
    if (plan === 'day') expiresAt.setHours(expiresAt.getHours() + 24);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    await supabase.from('stream_access').insert({
      stream_id: streamId,
      user_id: user.id,
      plan,
      price_paid: price,
      expires_at: expiresAt.toISOString()
    });

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'stream_access',
      amount: -price,
      description: `Stream access - ${plan === 'day' ? '24 hours' : '1 month'}`
    });

    setHasAccess(true);
    setShowPaywall(false);
    onUnlocked();
    setLoading(false);
  };

  // Show countdown bar during preview
  if (!showPaywall && !hasAccess) {
    const pct = (secondsLeft / PREVIEW_SECONDS) * 100;
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;

    return (
      <div className="absolute bottom-20 left-4 right-4 z-20">
        <div className="bg-black/70 backdrop-blur rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-300">Free preview</span>
            <span className="text-xs font-mono text-white font-bold">
              {mins}:{secs.toString().padStart(2, '0')} left
            </span>
          </div>
          <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!showPaywall) return null;

  // Paywall overlay
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4">
        {/* Lock icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Preview Ended</h2>
          <p className="text-zinc-400 text-sm">
            Unlock full access to <span className="text-white font-medium">{creatorName}</span>'s stream
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-3 mb-6">
          {/* Day pass */}
          <button
            onClick={() => handlePay('day')}
            disabled={loading}
            className="w-full p-4 rounded-xl border-2 border-teal-500 bg-teal-500/10 hover:bg-teal-500/20 transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-teal-400" />
                <div>
                  <p className="font-bold text-white">24-Hour Pass</p>
                  <p className="text-xs text-zinc-400">Full access for today</p>
                </div>
              </div>
              <span className="text-xl font-bold text-teal-400">$2.95</span>
            </div>
          </button>

          {/* Monthly */}
          <button
            onClick={() => handlePay('month')}
            disabled={loading}
            className="w-full p-4 rounded-xl border-2 border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              BEST VALUE
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-bold text-white">Monthly Access</p>
                  <p className="text-xs text-zinc-400">Unlimited for 30 days</p>
                </div>
              </div>
              <span className="text-xl font-bold text-purple-400">$9.95</span>
            </div>
          </button>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {['Full stream access', 'Live chat & tips', 'Private show requests', 'HD quality'].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
              <Star className="w-3 h-3 text-teal-400 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-600 text-center">
          Funds deducted from your wallet balance. <br />
          <a href="/wallet" className="text-teal-500 hover:underline">Add funds →</a>
        </p>
      </div>
    </div>
  );
}
