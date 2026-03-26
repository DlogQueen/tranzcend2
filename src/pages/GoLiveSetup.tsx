import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Users, Lock, UsersRound, Zap, DollarSign, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

type ShowType = 'public' | 'private' | 'group' | 'interactive';

export default function GoLiveSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showType, setShowType] = useState<ShowType>('public');
  const [pricePerMinute, setPricePerMinute] = useState(5.0);
  const [minViewers, setMinViewers] = useState(3);
  const [maxViewers, setMaxViewers] = useState(10);
  const [tipGoal, setTipGoal] = useState(100);
  const [tipGoalDescription, setTipGoalDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const showTypes = [
    {
      type: 'public' as ShowType,
      icon: Users,
      title: 'Public Show',
      description: 'Free for all viewers. Earn from tips and virtual gifts.',
      color: 'from-blue-500 to-cyan-500',
      features: ['Unlimited viewers', 'Tips & gifts', 'Public chat']
    },
    {
      type: 'private' as ShowType,
      icon: Lock,
      title: 'Private Show',
      description: 'One-on-one exclusive time. Viewers pay per minute.',
      color: 'from-purple-500 to-pink-500',
      features: ['1-on-1 exclusive', 'Pay per minute', 'Private chat']
    },
    {
      type: 'group' as ShowType,
      icon: UsersRound,
      title: 'Group Show',
      description: 'Small group experience. Multiple viewers pay per minute.',
      color: 'from-orange-500 to-red-500',
      features: ['Limited viewers', 'Pay per minute', 'Group chat']
    },
    {
      type: 'interactive' as ShowType,
      icon: Zap,
      title: 'Interactive Show',
      description: 'Use interactive toys that respond to tips. Maximum engagement!',
      color: 'from-green-500 to-teal-500',
      features: ['Toy control', 'Tip goals', 'Interactive fun']
    }
  ];

  const handleStartShow = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('start_show', {
        p_show_type: showType,
        p_price_per_minute: showType === 'public' ? 0 : pricePerMinute,
        p_min_viewers: showType === 'group' ? minViewers : 1,
        p_max_viewers: showType === 'private' ? 1 : (showType === 'group' ? maxViewers : null),
        p_tip_goal: showType === 'interactive' ? tipGoal : 0,
        p_tip_goal_description: showType === 'interactive' ? tipGoalDescription : null
      });

      if (error) throw error;

      if (data.success) {
        navigate('/studio');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error starting show:', error);
      alert('Failed to start show');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/studio">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Go Live</h1>
            <p className="text-zinc-400">Choose your show type and settings</p>
          </div>
        </div>

        {/* Show Type Selection */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {showTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = showType === type.type;
            
            return (
              <button
                key={type.type}
                onClick={() => setShowType(type.type)}
                className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{type.title}</h3>
                <p className="text-sm text-zinc-400 mb-4">{type.description}</p>
                <div className="space-y-1">
                  {type.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                      <div className="w-1 h-1 rounded-full bg-zinc-600" />
                      {feature}
                    </div>
                  ))}
                </div>
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Settings */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Show Settings
          </h3>

          {(showType === 'private' || showType === 'group') && (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Price per Minute (${pricePerMinute})
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={pricePerMinute}
                  onChange={(e) => setPricePerMinute(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                  <span>$1/min</span>
                  <span>$20/min</span>
                </div>
              </div>
            </div>
          )}

          {showType === 'group' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Min Viewers to Start
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={minViewers}
                  onChange={(e) => setMinViewers(parseInt(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Max Viewers
                </label>
                <input
                  type="number"
                  min={minViewers}
                  max="50"
                  value={maxViewers}
                  onChange={(e) => setMaxViewers(parseInt(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          )}

          {showType === 'interactive' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Tip Goal (${tipGoal})
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={tipGoal}
                  onChange={(e) => setTipGoal(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  What happens when goal is reached?
                </label>
                <input
                  type="text"
                  value={tipGoalDescription}
                  onChange={(e) => setTipGoalDescription(e.target.value)}
                  placeholder="e.g., Take off top, special dance, etc."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-600"
                />
              </div>
            </div>
          )}

          {showType === 'public' && (
            <div className="text-center py-4 text-zinc-500">
              <p className="text-sm">Public shows are free to watch.</p>
              <p className="text-xs mt-1">You'll earn from tips and virtual gifts!</p>
            </div>
          )}
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStartShow}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 text-lg"
        >
          {loading ? 'Starting...' : 'Start Show'}
        </Button>

        {/* Info */}
        <div className="mt-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <p className="text-xs text-zinc-500 text-center">
            By going live, you agree to follow our Community Guidelines and Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
