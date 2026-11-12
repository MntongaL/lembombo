import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, List, Text } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { StatusBanner } from '@/components/StatusBanner';
import { useResource } from '@/hooks/useResource';
import { useAuth } from '@/providers/AuthProvider';
import { useSync } from '@/providers/SyncProvider';
import { medicationRepository } from '@/repositories/medicationRepository';
import { sheepRepository } from '@/repositories/sheepRepository';
import { treatmentRepository } from '@/repositories/treatmentRepository';
import { commonStyles } from '@/theme/commonStyles';
import { formatDate, formatDateObj, formatDateTime } from '@/utils/date';
import { withdrawalFor } from '@/utils/treatmentWithdrawal';

export default function DashboardScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { online, syncing, pendingCount, lastSyncedAt, syncNow } = useSync();
  const sheep = useResource(() => sheepRepository.list(), 'dash-sheep');
  const meds = useResource(() => medicationRepository.list(), 'dash-meds');
  const treatments = useResource(() => treatmentRepository.list(), 'dash-treatments');

  const sheepCount = sheep.data?.filter((s) => !s._pendingOpId).length;
  const medCount = meds.data?.filter((m) => !m._pendingOpId).length;
  const recent = (treatments.data ?? []).slice(0, 5);

  const warnings = useMemo(() => {
    const byId = new Map((meds.data ?? []).map((m) => [String(m.id), m]));
    return (treatments.data ?? [])
      .map((t) => ({ t, w: withdrawalFor(t, byId.get(String(t.medicationId))) }))
      .filter((x) => x.w.active);
  }, [treatments.data, meds.data]);

  const source = [sheep.source, meds.source, treatments.source].includes('cached') ? 'cached' : sheep.source;
  const refreshing = sheep.refreshing || meds.refreshing || treatments.refreshing;
  const refreshAll = () => { void sheep.refresh(); void meds.refresh(); void treatments.refresh(); };

  return (
    <Screen refreshing={refreshing} onRefresh={refreshAll}>
      <StatusBanner source={source} fetchedAt={sheep.fetchedAt} />
      <View style={commonStyles.rowWrap}>
        <Card style={[commonStyles.card, { flex: 1, minWidth: 140 }]}>
          <Card.Content><Text variant="labelLarge">Total sheep</Text><Text variant="displaySmall">{sheepCount ?? '—'}</Text></Card.Content>
        </Card>
        <Card style={[commonStyles.card, { flex: 1, minWidth: 140 }]}>
          <Card.Content><Text variant="labelLarge">Medications</Text><Text variant="displaySmall">{medCount ?? '—'}</Text></Card.Content>
        </Card>
      </View>

      <View style={commonStyles.rowWrap}>
        <Button mode="contained" icon="plus" onPress={() => router.push('/sheep/new')}>Register sheep</Button>
        <Button mode="contained-tonal" icon="pill" onPress={() => router.push('/medications')}>Medications</Button>
        <Button mode="contained-tonal" icon="needle" onPress={() => router.push('/treatments/new')}>Record treatment</Button>
      </View>

      <Card style={commonStyles.card}>
        <Card.Title title="Withdrawal-period warnings" subtitle="Only where medication withdrawal days are recorded" />
        <Card.Content>
          {warnings.length === 0 ? <Text variant="bodyMedium">No active withdrawal periods found in available data.</Text> : warnings.slice(0, 8).map(({ t, w }) => (
            <List.Item key={String(t.id)} title={`${t.sheepTagNumber ?? t.sheepName ?? t.sheepId} · ${t.medicationName ?? t.medicationId}`} description={`Until ${formatDateObj(w.end)}`} left={(p) => <List.Icon {...p} icon="alert-outline" color="#B26A00" />} onPress={() => router.push(`/treatments/${t.id}`)} />
          ))}
        </Card.Content>
      </Card>

      <Card style={commonStyles.card}>
        <Card.Title title="Recent treatments" />
        <Card.Content>
          {recent.length === 0 ? <Text variant="bodyMedium">No treatments recorded yet.</Text> : recent.map((t) => {
            const sheepName = sheep.data?.find((s) => String(s.id) === String(t.sheepId))?.name ?? t.sheepName ?? t.sheepId;
            return (
              <List.Item
                key={String(t.id)}
                title={`${meds.data?.find((m) => String(m.id) === String(t.medicationId))?.name}`}
                description={`${sheep.data?.find((s) =>
                  String(s.id) === String(s.id))?.tagNumber ?? sheepName} · ${formatDate(String(t.doseAmount))}${t.doseUnit ? ` ${t.doseUnit}` : ''}${String(t.administeredBy) ? ` • ${String(t.administeredBy)}` : ''}${String(t.administeredAt) ? ` • ${String(t.administeredAt)}` : ''}`}
                onPress={() => router.push(`/treatments/${t.id}`)} />
            )
          })}
        </Card.Content>
      </Card>

      <Card style={commonStyles.card}>
        <Card.Title title="Connection & sync" />
        <Card.Content style={{ gap: 8 }}>
          <View style={commonStyles.row}>
            <Chip icon={online ? 'wifi' : 'wifi-off'}>{online ? 'Online' : 'Offline'}</Chip>
            <Chip icon="cloud-upload-outline">{pendingCount} pending</Chip>
          </View>
          <Text variant="bodySmall">Last successful sync of queued items: {formatDateTime(lastSyncedAt)}</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => router.push('/pending')}>View queue</Button>
          <Button onPress={() => void syncNow()} loading={syncing} disabled={!online || syncing}>Sync now</Button>
        </Card.Actions>
      </Card>

      <Button icon="logout" onPress={() => void signOut()}>Sign out</Button>
    </Screen>
  );
}
