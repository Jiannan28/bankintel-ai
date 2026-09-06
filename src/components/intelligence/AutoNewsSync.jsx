import { useEffect, useRef, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const SYNC_INTERVAL_MS = 15 * 60 * 1000;

export default function AutoNewsSync({ onSynced }) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('autoNewsSync') === 'on');
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  const runSync = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('fetchFinancialNews', {});
      const created = res?.data?.created || 0;
      setMessage(created > 0 ? `+${created} article${created > 1 ? 's' : ''} synced` : 'Up to date');
      if (created > 0) onSyncedRef.current?.();
    } catch (e) {
      setMessage('Sync failed');
    } finally {
      setSyncing(false);
      busyRef.current = false;
    }
  };

  useEffect(() => {
    localStorage.setItem('autoNewsSync', enabled ? 'on' : 'off');
    if (!enabled) { setMessage(''); return; }
    runSync();
    const iv = setInterval(runSync, SYNC_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [enabled]);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-card">
      <RefreshCw className={cn('w-4 h-4 text-primary shrink-0', syncing && 'animate-spin')} />
      <div className="text-sm leading-tight">
        <div className="font-medium text-primary">Auto News Sync</div>
        {message && <div className="text-[11px] text-muted-foreground">{message}</div>}
      </div>
      <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Toggle auto news sync" />
    </div>
  );
}