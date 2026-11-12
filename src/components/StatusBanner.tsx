import React from 'react';
import { Banner } from 'react-native-paper';
import { useSync } from '@/providers/SyncProvider';
import { formatDateTime } from '@/utils/date';
import type { DataSource } from '@/types/app';

/** Tells the user whether what they see is current, cached, or waiting to sync. */
export function StatusBanner({ source, fetchedAt }: { source: DataSource | null; fetchedAt: string | null }) {
  const { online, pendingCount } = useSync();
  let text: string | null = null;
  if (source === 'cached') text = `Showing cached data from ${formatDateTime(fetchedAt)}${online ? ' (server unreachable)' : ' (offline)'}.`;
  else if (!online) text = 'You are offline. New records will be saved on this device and sent when you reconnect.';
  else if (pendingCount > 0) text = `${pendingCount} change${pendingCount === 1 ? '' : 's'} not yet confirmed by the server.`;
  return (
    <Banner visible={text !== null} icon={source === 'cached' || !online ? 'cloud-off-outline' : 'cloud-sync-outline'}>
      {text ?? ''}
    </Banner>
  );
}
