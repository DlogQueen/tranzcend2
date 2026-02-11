import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password', // We will need to create this route
      });

      if (error) throw error;
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to send reset email.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="text-zinc-400">
            We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
          </p>
          <Link 
            to="/login"
            className="block w-full py-3 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition text-white"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800 space-y-6">
        <Link to="/login" className="inline-flex items-center text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-zinc-400">Enter your email to receive a reset link.</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50"
          >
            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
