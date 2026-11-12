import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Chip, List } from 'react-native-paper';
import { ListScreen } from '@/components/ListScreen';
import { PendingChip } from '@/components/PendingChip';
import { useResource } from '@/hooks/useResource';
import { medicationRepository } from '@/repositories/medicationRepository';
import { treatmentRepository } from '@/repositories/treatmentRepository';
import { commonStyles } from '@/theme/commonStyles';
import { formatDate, formatDateObj } from '@/utils/date';
import { matchesSearch } from '@/utils/list';
import { withdrawalFor } from '@/utils/treatmentWithdrawal';
import { LookupType } from '@/types/db';
import sheep from './sheep';
import { sheepRepository } from '@/repositories/sheepRepository';

export default function TreatmentListScreen() {
  const router = useRouter();
  const res = useResource(() => treatmentRepository.list(), LookupType.TREATMENT);
  const meds = useResource(() => medicationRepository.list(), LookupType.MEDICATION);
  const sheep = useResource(() => sheepRepository.list(), LookupType.SHEEP);
  const [query, setQuery] = useState('');

  const medById = useMemo(() => new Map((meds.data ?? []).map((m) => [String(m.id), m])), [meds.data]);
  const sheepById = useMemo(() => new Map((sheep.data ?? []).map((m) => [String(m.id), m])), [sheep.data]);
  const visible = useMemo(
    () => (res.data ?? []).filter((t) => matchesSearch([t.administeredBy, String(t.doseAmount), t.notes], query)),
    [res.data, query],
  );

  return (
    <ListScreen
      data={visible}
      loading={res.loading}
      refreshing={res.refreshing}
      error={res.error}
      source={res.source}
      fetchedAt={res.fetchedAt}
      onRefresh={res.refresh}
      onRetry={res.reload}
      query={query}
      onQueryChange={setQuery}
      keyExtractor={(t) => String(t.id)}
      emptyIcon="needle"
      emptyTitle="No treatments yet"
      emptyHint="Record a treatment for a sheep to start the history."
      addLabel="Record treatment"
      onAdd={() => router.push('/treatments/new')}
      renderItem={(t) => {
        const w = withdrawalFor(t, medById.get(String(t.medicationId)));
        return (
          <List.Item
            style={[commonStyles.card, commonStyles.minTouch]}
            title={`${sheepById.get(String(t.sheepId))?.tagNumber ?? sheepById.get(String(t.sheepId))?.name ?? t.sheepId} · ${medById.get(String(t.medicationId))?.name ?? t.medicationId}`}
            description={`${formatDate(String(t.administeredAt))}${t.administeredBy ? ` · ${t.doseUnit}` : ''}${w.active ? ` · withdrawal until ${formatDateObj(w.end)}` : ''}`}
            left={(p) => <List.Icon {...p} icon={w.active ? 'alert-outline' : 'needle'} color={w.active ? '#B26A00' : undefined} />}
            right={() => (t._pendingStatus ? <PendingChip status={t._pendingStatus} /> : w.active ? <Chip compact>Withdrawal</Chip> : null)}
            onPress={() => router.push(`/treatments/${encodeURIComponent(String(t.id))}`)}
          />
        );
      }}
    />
  );
}
