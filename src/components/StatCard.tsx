import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
}

export default function StatCard({ icon: Icon, title, value }: StatCardProps) {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-4">
        <Icon className="w-8 h-8 text-zinc-500" />
        <div>
          <h3 className="text-zinc-400 text-xs uppercase font-bold">{title}</h3>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
