import { BadgeCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <div className={cn("inline-flex items-center justify-center rounded-full bg-blue-500/10 p-1", className)}>
      <BadgeCheck className="h-4 w-4 text-blue-500" />
    </div>
  );
}
