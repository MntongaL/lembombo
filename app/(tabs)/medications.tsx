import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Chip, List } from 'react-native-paper';
import { ListScreen } from '@/components/ListScreen';
import { PendingChip } from '@/components/PendingChip';
import { useResource } from '@/hooks/useResource';
import { medicationRepository } from '@/repositories/medicationRepository';
import { commonStyles } from '@/theme/commonStyles';
import { matchesSearch } from '@/utils/list';

type Filter = 'all' | 'active' | 'inactive';

export default function MedicationListScreen() {
  const router = useRouter();
  const res = useResource(() => medicationRepository.list(), 'med-list');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () =>
      (res.data ?? [])
        .filter((m) => (filter === 'all' ? true : filter === 'active' ? m.active !== false : m.active === false))
        .filter((m) => matchesSearch([m.name, m.route, m.dosageInstructions], query))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [res.data, query, filter],
  );
  console.log('MedicationListScreen', 'visible', visible,);
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
      keyExtractor={(m) => String(m.id)}
      emptyIcon="pill"
      emptyTitle="No medications found"
      emptyHint="Add a medication to the catalogue, or adjust your search."
      addLabel="Add medication"
      onAdd={() => router.push('/medications/new')}
      header={
        <View style={commonStyles.rowWrap}>
          {(['all', 'active', 'inactive'] as const).map((f) => <Chip key={f} selected={filter === f} onPress={() => setFilter(f)}>{f[0]?.toUpperCase()}{f.slice(1)}</Chip>)}
        </View>
      }
      renderItem={(m) => (
        <List.Item
          style={[commonStyles.card, commonStyles.minTouch]}
          title={m.name}
          description={[m.administrationType, m.withdrawalDays != null ? `Withdrawal ${m.withdrawalDays} days` : undefined, m.active === false ? 'Inactive' : undefined].filter(Boolean).join(' · ') || undefined}
          left={(p) => <List.Icon {...p} icon="pill" />}
          right={() => <PendingChip status={m._pendingStatus} />}
          onPress={() => router.push({ pathname: `/medications/${encodeURIComponent(String(m.id))}`, params: { source: 'med-list', } })}
        />
      )}
    />
  );
}
