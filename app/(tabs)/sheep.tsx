import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Chip, List } from 'react-native-paper';
import { ListScreen } from '@/components/ListScreen';
import { PendingChip } from '@/components/PendingChip';
import { useResource } from '@/hooks/useResource';
import { sheepRepository, type SheepItem } from '@/repositories/sheepRepository';
import { commonStyles } from '@/theme/commonStyles';
import { matchesSearch } from '@/utils/list';
import { formatMonth } from '@/utils/date';

type SortKey = 'tag' | 'name';

export default function SheepListScreen() {
  const router = useRouter();
  const res = useResource(() => sheepRepository.list(), 'sheep-list');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('tag');

  const statuses = useMemo(() => Array.from(new Set((res.data ?? []).map((s) => s.status).filter((s): s is string => !!s))).sort(), [res.data]);

  const visible = useMemo(() => {
    const filtered = (res.data ?? []).filter((s) => (status ? s.status === status : true) && matchesSearch([s.tagNumber, s.name, s.breed, s.status], query));
    const key = (s: SheepItem) => (sort === 'tag' ? s.tagNumber : s.name) ?? '';
    return [...filtered].sort((a, b) => key(a).localeCompare(key(b), undefined, { numeric: true }));
  }, [res.data, query, status, sort]);

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
      keyExtractor={(s) => String(s.id)}
      emptyIcon="sheep"
      emptyTitle="No sheep found"
      emptyHint="Register a sheep, or adjust your search and filters."
      addLabel="Register sheep"
      onAdd={() => router.push('/sheep/new')}
      header={
        <View style={commonStyles.rowWrap}>
          <Chip selected={sort === 'tag'} onPress={() => setSort('tag')} icon="sort">Sort: tag</Chip>
          <Chip selected={sort === 'name'} onPress={() => setSort('name')} icon="sort">Sort: name</Chip>
          {statuses.map((st) => <Chip key={st} selected={status === st} onPress={() => setStatus(status === st ? null : st)}>{st}</Chip>)}
        </View>
      }
      renderItem={(s) => (
        <List.Item
          style={[commonStyles.card, commonStyles.minTouch]}
          title={s.tagNumber ?? s.name ?? String(s.id)}
          description={[s.name, formatMonth(s.birthMonth), s.birthYear, s.status].filter(Boolean).join(' · ') || undefined}
          left={(p) => <List.Icon {...p} icon="sheep" />}
          right={() => <PendingChip status={s._pendingStatus} />}
          onPress={() => router.push(`/sheep/${encodeURIComponent(String(s.id))}`)}
        />
      )}
    />
  );
}
