import { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';
import { formatDate, formatTime, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function LiveClock({ className, showIcon = true }) {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateFormat = user?.company?.settings?.dateFormat || 'BS';
  const displayDate = formatDate(now, dateFormat);
  const displayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {showIcon && (
        <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30">
          <ClockIcon className="h-6 w-6" />
        </div>
      )}
      <div className="flex flex-col text-center sm:text-left">
        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {formatTime(now)}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {displayDay}, {displayDate}
        </span>
      </div>
    </div>
  );
}
