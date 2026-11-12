import React from 'react';
import { FlatList, View } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import { commonStyles, spacing } from '@/theme/commonStyles';
import type { DataSource } from '@/types/app';
import { StatusBanner } from './StatusBanner';
import { EmptyState, ErrorView, LoadingView } from './StateViews';

interface Props<T> {
  data: T[] | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  source: DataSource | null;
  fetchedAt: string | null;
  onRefresh: () => void;
  onRetry: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  header?: React.ReactNode;
  renderItem: (item: T) => React.ReactElement;
  keyExtractor: (item: T) => string;
  emptyIcon: React.ComponentProps<typeof EmptyState>['icon'];
  emptyTitle: string;
  emptyHint: string;
  onAdd?: () => void;
  addLabel?: string;
}

export function ListScreen<T>(p: Props<T>) {
  return (
    <View style={commonStyles.grow}>
      <StatusBanner source={p.source} fetchedAt={p.fetchedAt} />
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <Searchbar placeholder="Search" value={p.query} onChangeText={p.onQueryChange} />
        {p.header}
      </View>
      {p.loading ? <LoadingView /> : p.error && !p.data ? <ErrorView message={p.error} onRetry={p.onRetry} /> : (
        <FlatList
          data={p.data ?? []}
          keyExtractor={p.keyExtractor}
          renderItem={({ item }) => p.renderItem(item)}
          refreshing={p.refreshing}
          onRefresh={p.onRefresh}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 96, gap: spacing.sm, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState icon={p.emptyIcon} title={p.emptyTitle} hint={p.emptyHint} actionLabel={p.addLabel} onAction={p.onAdd} />}
        />
      )}
      {p.onAdd ? <FAB icon="plus" label={p.addLabel} style={commonStyles.fab} onPress={p.onAdd} /> : null}
    </View>
  );
}
