import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Shield, AlertTriangle, Heart, Phone, Lock, Eye, EyeOff, UserX, Flag, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SupportResource {
  id: string;
  title: string;
  description: string;
  category: string;
  phone_number?: string;
  url?: string;
  is_crisis_line: boolean;
  is_lgbtq_specific: boolean;
}

export default function SafetyCenter() {
  const { user } = useAuth();
  const [resources, setResources] = useState<SupportResource[]>([]);
  const [privacySettings, setPrivacySettings] = useState({
    show_location: false,
    show_real_name: false,
    allow_screenshots: false,
    blur_background: false,
    hide_from_search: false,
    anonymous_tips: false
  });
  const [safetySettings, setSafetySettings] = useState({
    auto_block_new_accounts: false,
    require_friend_to_message: true,
    filter_offensive_messages: true,
    hide_from_non_lgbtq: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchResources();
  }, []);

  const fetchSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('privacy_settings, safety_settings')
      .eq('id', user.id)
      .single();

    if (data) {
      setPrivacySettings(data.privacy_settings || privacySettings);
      setSafetySettings(data.safety_settings || safetySettings);
    }
    setLoading(false);
  };

  const fetchResources = async () => {
    const { data } = await supabase
      .from('support_resources')
      .select('*')
      .eq('is_active', true)
      .order('is_crisis_line', { ascending: false });

    if (data) setResources(data);
  };

  const updatePrivacySetting = async (key: string, value: boolean) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);

    await supabase
      .from('profiles')
      .update({ privacy_settings: newSettings })
      .eq('id', user!.id);
  };

  const updateSafetySetting = async (key: string, value: boolean) => {
    const newSettings = { ...safetySettings, [key]: value };
    setSafetySettings(newSettings);

    await supabase
      .from('profiles')
      .update({ safety_settings: newSettings })
      .eq('id', user!.id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'crisis': return AlertTriangle;
      case 'lgbtq_support': return Heart;
      case 'mental_health': return LifeBuoy;
      default: return Phone;
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Safety Center</h1>
          <p className="text-zinc-400">Your safety and privacy are our top priorities</p>
        </div>

        {/* Crisis Resources */}
        <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 rounded-2xl border border-red-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold">Need Help Now?</h2>
          </div>
          <p className="text-zinc-300 mb-4">
            If you're in crisis or need immediate support, these resources are available 24/7:
          </p>
          <div className="space-y-3">
            {resources.filter(r => r.is_crisis_line).map(resource => {
              const Icon = getCategoryIcon(resource.category);
              return (
                <div key={resource.id} className="bg-black/30 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{resource.title}</h3>
                    <p className="text-sm text-zinc-400 mb-2">{resource.description}</p>
                    {resource.phone_number && (
                      <a href={`tel:${resource.phone_number}`} className="text-red-400 font-bold hover:text-red-300">
                        {resource.phone_number}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Privacy Settings</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'show_location', label: 'Show my location', description: 'Display your city/region on your profile' },
              { key: 'show_real_name', label: 'Show real name', description: 'Display your legal name instead of username' },
              { key: 'allow_screenshots', label: 'Allow screenshots', description: 'Let viewers take screenshots during shows' },
              { key: 'blur_background', label: 'Blur background', description: 'Automatically blur your background in streams' },
              { key: 'hide_from_search', label: 'Hide from search', description: 'Don\'t appear in discovery or search results' },
              { key: 'anonymous_tips', label: 'Anonymous tips', description: 'Hide your identity when sending tips' }
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
                <div className="flex-1">
                  <h3 className="font-medium text-white">{setting.label}</h3>
                  <p className="text-sm text-zinc-400">{setting.description}</p>
                </div>
                <button
                  onClick={() => updatePrivacySetting(setting.key, !privacySettings[setting.key as keyof typeof privacySettings])}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    privacySettings[setting.key as keyof typeof privacySettings] ? 'bg-purple-600' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    privacySettings[setting.key as keyof typeof privacySettings] ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Settings */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold">Safety Settings</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'auto_block_new_accounts', label: 'Auto-block new accounts', description: 'Automatically block accounts less than 7 days old' },
              { key: 'require_friend_to_message', label: 'Friends-only messages', description: 'Only friends can send you messages' },
              { key: 'filter_offensive_messages', label: 'Filter offensive content', description: 'Automatically hide potentially offensive messages' },
              { key: 'hide_from_non_lgbtq', label: 'LGBTQ+ only visibility', description: 'Only show your profile to verified LGBTQ+ users' }
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
                <div className="flex-1">
                  <h3 className="font-medium text-white">{setting.label}</h3>
                  <p className="text-sm text-zinc-400">{setting.description}</p>
                </div>
                <button
                  onClick={() => updateSafetySetting(setting.key, !safetySettings[setting.key as keyof typeof safetySettings])}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    safetySettings[setting.key as keyof typeof safetySettings] ? 'bg-green-600' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    safetySettings[setting.key as keyof typeof safetySettings] ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* LGBTQ+ Support Resources */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl border border-purple-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">LGBTQ+ Support</h2>
          </div>
          <div className="space-y-3">
            {resources.filter(r => r.is_lgbtq_specific && !r.is_crisis_line).map(resource => {
              const Icon = getCategoryIcon(resource.category);
              return (
                <div key={resource.id} className="bg-black/30 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{resource.title}</h3>
                    <p className="text-sm text-zinc-400 mb-2">{resource.description}</p>
                    {resource.phone_number && (
                      <a href={`tel:${resource.phone_number}`} className="text-purple-400 font-medium hover:text-purple-300">
                        {resource.phone_number}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/blocked-users">
            <Button variant="outline" className="w-full justify-start">
              <UserX className="mr-2 h-5 w-5" />
              Manage Blocked Users
            </Button>
          </Link>
          <Link to="/report-history">
            <Button variant="outline" className="w-full justify-start">
              <Flag className="mr-2 h-5 w-5" />
              View Report History
            </Button>
          </Link>
        </div>

        {/* Community Guidelines */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <h2 className="text-xl font-bold mb-4">Community Guidelines</h2>
          <div className="space-y-3 text-sm text-zinc-400">
            <p>✓ Respect all identities, pronouns, and expressions</p>
            <p>✓ Zero tolerance for hate speech, transphobia, or discrimination</p>
            <p>✓ Consent is mandatory - respect boundaries always</p>
            <p>✓ No harassment, stalking, or threatening behavior</p>
            <p>✓ Protect your privacy - don't share personal information</p>
            <p>✓ Report any violations immediately</p>
          </div>
          <Link to="/guidelines">
            <Button variant="outline" className="w-full mt-4">
              Read Full Guidelines
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
