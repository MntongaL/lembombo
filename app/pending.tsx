import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Button, Card, Text } from 'react-native-paper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PendingChip } from '@/components/PendingChip';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/StateViews';
import { useSnackbar } from '@/providers/SnackbarProvider';
import { useSync } from '@/providers/SyncProvider';
import { pendingRepository } from '@/repositories/pendingRepository';
import { commonStyles } from '@/theme/commonStyles';
import type { PendingOperation } from '@/types/app';
import { formatDateTime } from '@/utils/date';

type Action = { kind: 'resend' | 'discard'; op: PendingOperation } | null;

function summarize(op: PendingOperation): string {
  try {
    const p = JSON.parse(op.payload) as Record<string, unknown>;
    const parts = [p.tagNumber, p.name, p.treatmentDate, p.dosage].filter((v): v is string => typeof v === 'string');
    return parts.join(' · ');
  } catch {
    return '';
  }
}

export default function PendingScreen() {
  const { show } = useSnackbar();
  const { online, syncing, pendingCount, syncNow, refreshPending } = useSync();
  const [ops, setOps] = useState<PendingOperation[]>([]);
  const [action, setAction] = useState<Action>(null);

  const load = useCallback(async () => { setOps(await pendingRepository.list()); }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load, pendingCount, syncing]));

  const confirm = async () => {
    if (!action) return;
    if (action.kind === 'resend') await pendingRepository.resend(action.op.id);
    else await pendingRepository.discard(action.op.id);
    setAction(null);
    await refreshPending();
    await load();
    if (action.kind === 'resend') { show('Queued to send again.'); void syncNow(); }
  };

  return (
    <Screen>
      <Button mode="contained" icon="sync" onPress={() => void syncNow()} loading={syncing} disabled={!online || syncing}>Sync now</Button>
      {ops.length === 0 ? <EmptyState icon="cloud-check-outline" title="Nothing waiting" hint="All changes have been confirmed by the server." /> : ops.map((op) => (
        <Card key={op.id} style={commonStyles.card}>
          <Card.Title title={`${op.entity} · create`} subtitle={`Saved ${formatDateTime(op.createdAt)}`} />
          <Card.Content style={{ gap: 8 }}>
            <PendingChip status={op.status} />
            <Text variant="bodyMedium">{summarize(op)}</Text>
            {op.error ? <Text variant="bodySmall" style={{ color: '#B3261E' }}>{op.error}</Text> : null}
          </Card.Content>
          <Card.Actions>
            {op.status === 'unconfirmed' ? <Button onPress={() => setAction({ kind: 'resend', op })}>Send again</Button> : null}
            {op.status !== 'syncing' ? <Button onPress={() => setAction({ kind: 'discard', op })}>Discard</Button> : null}
          </Card.Actions>
        </Card>
      ))}
      <ConfirmDialog
        visible={action !== null}
        title={action?.kind === 'resend' ? 'Send again?' : 'Discard this change?'}
        message={action?.kind === 'resend' ? 'The first attempt got no answer, so it may already have been saved. Sending again could create a duplicate record. Check the server data first if unsure.' : 'The record will be removed from this device and will NOT be sent to the server.'}
        confirmLabel={action?.kind === 'resend' ? 'Send again' : 'Discard'}
        onConfirm={() => void confirm()}
        onDismiss={() => setAction(null)}
      />
    </Screen>
  );
}
