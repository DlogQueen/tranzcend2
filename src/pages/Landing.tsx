import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, ChevronRight, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export default function Landing() {
  const { user } = useAuth();

  // If already logged in, redirect to the app
  if (user) {
    return <Navigate to="/discover" replace />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#121212]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo.jpg" alt="Tranzcend X" className="h-32 object-contain" />
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-900/30 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-pink-900/20 rounded-full blur-[100px] -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-6">
                 <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 px-4 py-1.5 border border-amber-500/30 backdrop-blur-md">
                    <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">⚡️ Limited Time Offer: Free Premium Status</span>
                 </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight font-serif">
              Unveil Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 italic">
                True Desires.
              </span>
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Enter a world where boundaries fade and connections deepen. 
            The premier sanctuary for the trans community and those who adore them.
            <br/><span className="text-white font-medium">No bots. No fakes. No ads. Just pure, verified intimacy.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 h-12 px-8 text-base font-semibold">
                Start Tranzcending
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 hover:bg-white/5 h-12 px-8 text-base">
                Log In <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-24 px-6 bg-zinc-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400">Tranzcend X</span> is Different</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              We aren't just another dating app or content site. We are the first ecosystem built to solve the specific problems of our community.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1: The Social-Hookup Hybrid */}
            <div className="group relative p-8 rounded-3xl bg-zinc-900 border border-white/5 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Find Your Vibe, Then Your Match.</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Why choose between a social network and a dating app? Tranzcend X is the first platform to seamlessly blend a <span className="text-purple-300">location-based grid</span> with a dynamic <span className="text-purple-300">social feed</span>. Follow creators, join groups, and build your community—or find someone nearby for right now. It's your space to connect on your terms.
                </p>
              </div>
            </div>

            {/* Pillar 2: The Creator Economy, Reimagined */}
            <div className="group relative p-8 rounded-3xl bg-zinc-900 border border-white/5 hover:border-teal-500/50 transition-all duration-300 hover:-translate-y-1">
               <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
               <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Your Content, Your Control, Your Cash.</h3>
                <p className="text-zinc-400 leading-relaxed">
                  We've built the ultimate toolkit for creators. Monetize your content with <span className="text-teal-300">subscriptions and unlocks</span>, go live to your audience, and get paid with an <span className="text-teal-300 font-bold">industry-leading revenue share</span>. No more juggling platforms—your entire brand lives here.
                </p>
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/50 to-teal-900/50 rounded-xl border border-purple-500/30">
                  <p className="text-sm text-purple-300 font-bold uppercase mb-2">🚀 Launch Offer - Limited Time</p>
                  <p className="text-white text-lg font-bold mb-1">First 100 Verified Creators: Keep 100% Forever</p>
                  <p className="text-zinc-300 text-sm">Bring your following, keep everything you earn. No platform fees, ever.</p>
                  <p className="text-zinc-400 text-xs mt-2">After launch: 90% (6 months) → 85% (1 year) → 80% standard</p>
                </div>
              </div>
            </div>

            {/* Pillar 3: A Verified, Queer-First Space */}
            <div className="group relative p-8 rounded-3xl bg-zinc-900 border border-white/5 hover:border-fuchsia-500/50 transition-all duration-300 hover:-translate-y-1">
               <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity" />
               <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Real People, Real Connections.</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Say goodbye to catfishing and bots. Our <span className="text-fuchsia-300">Blue Check</span> is earned through ID verification, ensuring every interaction is with a real, authentic member of the community. This is a space built by and for queer people, where you can be yourself without compromise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Split */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              For the <span className="text-purple-400">Creators</span>
            </h2>
            <p className="text-lg text-zinc-400">
              Stop splitting your audience between different platforms. Tranzcend X brings them all to one place.
            </p>
            <ul className="space-y-4">
              {[
                'Verified "Blue Check" Badge',
                'Set your own Subscription & Unlock rates',
                'Go Live directly from your profile',
                '🔥 First 100 creators: Keep 100% forever'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle className="w-5 h-5 text-purple-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-zinc-900 border border-white/10 flex items-center justify-center">
            {/* Abstract Visual representation of a Creator Profile */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616004655123-8185ebd979c2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
            <div className="relative z-10 text-center space-y-2">
                <div className="w-20 h-20 bg-purple-500 rounded-full mx-auto blur-2xl opacity-50 animate-pulse" />
                <div className="text-sm font-mono text-purple-300">CREATOR MODE ACTIVE</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center mt-24">
           <div className="relative h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-900/20 to-zinc-900 border border-white/10 flex items-center justify-center md:order-1 order-2">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay" />
             <div className="relative z-10 text-center space-y-2">
                 <div className="w-20 h-20 bg-teal-500 rounded-full mx-auto blur-2xl opacity-50 animate-pulse" />
                 <div className="text-sm font-mono text-teal-300">DISCOVERY ACTIVE</div>
             </div>
          </div>
          <div className="space-y-8 md:order-2 order-1">
            <h2 className="text-3xl md:text-4xl font-bold">
              For the <span className="text-teal-400">Admirers</span>
            </h2>
            <p className="text-lg text-zinc-400">
              Stop wasting time on bots and catfishes. Every creator on Tranzcend X is ID-verified. This is the premium experience you’ve been waiting for.
            </p>
            <ul className="space-y-4">
              {[
                'Zero bots, zero fakes',
                'Private, encrypted messaging',
                'Support creators directly',
                'Local discovery that actually works'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Ready to <span className="text-purple-400">Tranzcend</span>?
          </h2>
          <p className="text-xl text-zinc-400">
            Join the community that values authenticity, safety, and connection above all else.
          </p>
          <div className="flex justify-center pt-4">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white h-14 px-10 text-lg rounded-full shadow-lg shadow-purple-900/20">
                <Zap className="w-5 h-5 mr-2 fill-current" />
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-500 text-sm">
          <div className="flex flex-col gap-2">
            <div>
              &copy; {new Date().getFullYear()} Tranzcend X. All rights reserved.
            </div>
            <div className="text-zinc-600 text-xs">
              Also by TransNotDead (TND): <a href="https://huggingface.co/spaces/Thatbtchryleigh/PinkProtocal" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400 hover:underline">Check out Pink Protocol</a>
            </div>
          </div>
          <div className="flex gap-8">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/guidelines" className="hover:text-white transition-colors">Community Guidelines</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
