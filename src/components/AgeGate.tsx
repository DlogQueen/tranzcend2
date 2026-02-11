import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { ShieldAlert } from 'lucide-react';

export default function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasVerified = localStorage.getItem('age_verified');
    if (!hasVerified) {
      setShow(true);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem('age_verified', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-zinc-900 p-8 text-center border border-red-500/20 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Age Verification Required</h2>
          <p className="text-zinc-400">
            This platform contains adult content intended for mature audiences. 
            You must be at least 18 years old to enter.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white" 
            size="lg"
            onClick={handleVerify}
          >
            I am 18 or older - Enter
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-zinc-500 hover:text-white"
            onClick={() => window.location.href = 'https://google.com'}
          >
            Exit
          </Button>
        </div>
        
        <p className="text-xs text-zinc-600">
          By entering, you agree to our Terms of Service and confirm that you are of legal age in your jurisdiction.
        </p>
      </div>
    </div>
  );
}
