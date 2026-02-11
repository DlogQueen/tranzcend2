import { Outlet, useLocation, Link } from 'react-router-dom';
import { Compass, User, MessageSquare, Wallet, PlusSquare, Video } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (user) {
        supabase.from('profiles').select('is_creator').eq('id', user.id).single()
        .then(({ data }) => {
            if (data?.is_creator) setIsCreator(true);
        });
    }
  }, [user]);

  const navItems = [
    { icon: Compass, label: 'Discover', path: '/discover' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: PlusSquare, label: 'Create', path: '/create-post', highlight: true },
    { icon: isCreator ? Video : Wallet, label: isCreator ? 'Studio' : 'Wallet', path: isCreator ? '/creator-dashboard' : '/wallet' },
    { icon: User, label: 'Profile', path: user ? `/profile/${user.id}` : '/login' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-zinc-100">
      <main className="flex-1 pb-16 md:pb-0 md:pl-64">
        {/* Desktop Sidebar could go here, for now focusing on mobile-first structure */}
        <div className="container mx-auto max-w-2xl min-h-screen md:border-x md:border-zinc-800">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-surface/90 backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-around p-2">
          {navItems.map(({ icon: Icon, label, path, highlight }) => {
            const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
            
            if (highlight) {
                return (
                    <Link key={path} to={path} className="flex flex-col items-center justify-center -mt-6">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-teal-600 flex items-center justify-center shadow-lg shadow-purple-900/40 text-white">
                            <Icon className="h-7 w-7" />
                        </div>
                    </Link>
                )
            }

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex flex-col items-center justify-center space-y-1 rounded-lg p-2 transition-colors',
                  isActive ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Desktop Sidebar Placeholder (Hidden on Mobile) */}
      <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-64 border-r border-zinc-800 bg-surface p-4 md:block">
        <div className="flex h-full flex-col">
          <div className="mb-8 flex items-center px-2">
             <img src="/logo.jpg" alt="Tranzcend X" className="h-10 object-contain" />
          </div>
          <nav className="space-y-2">
            {navItems.map(({ icon: Icon, label, path, highlight }) => {
              const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
                    highlight && 'text-purple-400 font-bold'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </div>
  );
}
