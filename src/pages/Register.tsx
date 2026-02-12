import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Capture referral ID from URL
    const params = new URLSearchParams(window.location.search);
    const referralId = params.get('ref');

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (authError) throw authError;

      // Create profile entry
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username,
              referral_id: referralId || null,
              is_premium: true, // AUTO-GRANT PREMIUM
              is_verified: true, // AUTO-VERIFY WITH PREMIUM (Launch Special)
              premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 Days Free
            },
          ]);

        if (profileError) {
            // If profile creation fails, we might want to warn the user, but account is created
            console.error('Error creating profile:', profileError);
        }
      }

      navigate('/discover');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-surface p-8 shadow-2xl border border-zinc-800">
        <div className="text-center">
          <img src="/logo.jpg" alt="Tranzcend X" className="h-32 mx-auto mb-4 object-contain" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
            Create an Account
          </h2>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-1.5 border border-amber-500/30">
             <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
             </span>
             <span className="text-sm font-bold text-amber-400">Launch Special: Free Premium Included</span>
          </div>
          <p className="mt-4 text-sm text-zinc-400">
            Join Tranzcend X to connect and create
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <Input
              id="username"
              type="text"
              label="Username"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
          >
            Sign up
          </Button>

          <p className="text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
