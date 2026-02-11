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
              referral_id: referralId || null, // Save referral
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Join Transcend to connect and create
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
