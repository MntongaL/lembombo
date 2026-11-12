import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Button, Card, Dialog, List, Portal, Text } from 'react-native-paper';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { DetailRow } from '@/components/DetailRow';
import { PendingChip } from '@/components/PendingChip';
import { Screen } from '@/components/Screen';
import { StatusBanner } from '@/components/StatusBanner';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useResource } from '@/hooks/useResource';
import { useSnackbar } from '@/providers/SnackbarProvider';
import { sheepRepository } from '@/repositories/sheepRepository';
import { treatmentRepository } from '@/repositories/treatmentRepository';
import { statusSchema, type StatusFormValues } from '@/schemas';
import { toApiError } from '@/services/api/errors';
import { commonStyles } from '@/theme/commonStyles';
import { formatDate, formatDateTime, formatMonth } from '@/utils/date';
import { FormSelect } from '@/components/FormSelect';

export default function SheepDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(String(rawId));
  const router = useRouter();
  const { show } = useSnackbar();
  const sheep = useResource(() => sheepRepository.get(id), `sheep-${id}`);
  const treatments = useResource(() => treatmentRepository.list(), `sheep-treatments-${id}`);
  const [dialog, setDialog] = useState(false);

  const history = useMemo(() => (treatments.data ?? []).filter((t) => String(t.sheepId) === id), [treatments.data, id]);
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<StatusFormValues>({ resolver: zodResolver(statusSchema), defaultValues: { status: '' } });

  const s = sheep.data;
  if (!s) return null;
  const isLocal = !!s._pendingOpId;

  const submitStatus = async (v: StatusFormValues) => {
    try {
      await sheepRepository.updateStatus(id, v.status);
      setDialog(false);
      show('Status updated.');
      await sheep.reload();
    } catch (e) {
      const err = toApiError(e);
      show(err.kind === 'network' || err.kind === 'timeout' ? 'Status changes need a connection to the server.' : err.message);
    }
  };

  if (sheep.loading) return <LoadingView />;
  if (sheep.error && !sheep.data) return <ErrorView message={sheep.error} onRetry={sheep.reload} />;
  return (
    <Screen refreshing={sheep.refreshing} onRefresh={sheep.refresh}>
      <StatusBanner source={sheep.source} fetchedAt={sheep.fetchedAt} />
      <Card style={commonStyles.card}>
        <Card.Title title={s.tagNumber ?? s.name ?? String(s.id)} subtitle={s.status} />
        <Card.Content style={{ gap: 12 }}>
          <PendingChip status={s._pendingStatus} />
          <DetailRow label="Name" value={s.name} />
          <DetailRow label="Birth Month" value={formatMonth(s.birthMonth)} />
          <DetailRow label="Birth Year" value={s.birthYear} />
          <DetailRow label="Gender" value={s.sex} />
          <DetailRow label="Notes" value={s.notes} />
          <DetailRow label="Created at" value={s.createdAt ? formatDateTime(s.createdAt) : undefined} />
        </Card.Content>
        <Card.Actions>
          <Button disabled={isLocal} onPress={() => { reset({ status: s.status ?? '' }); setDialog(true); }}>Update status</Button>
          <Button mode="contained" disabled={isLocal} icon="needle" onPress={() => router.push(`/treatments/new?sheepId=${encodeURIComponent(id)}`)}>Record treatment</Button>
        </Card.Actions>
      </Card>

      <Card style={commonStyles.card}>
        <Card.Title title="Treatment history" />
        <Card.Content>
          {history.length === 0 ? <Text variant="bodyMedium">No treatments recorded for this sheep.</Text> : history.map((t) => {
            const doseLabel = formatDate(String(t.doseAmount));
            const withdrawalLabel = 'withdrawalUntil' in t && t.withdrawalUntil ? `, withdrawal until ${formatDate(String(t.withdrawalUntil))}` : '';
            return (
              <List.Item
                key={String(t.id)}
                title={t.medicationName ?? String(t.medicationId)}
                description={`${doseLabel}${t.doseUnit ? `${t.doseUnit}` : ''}${withdrawalLabel}`}
                right={() => <PendingChip status={t._pendingStatus} />}
                onPress={() => router.push(`/treatments/${encodeURIComponent(String(t.id))}`)} />
            );
          })}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={dialog} onDismiss={() => setDialog(false)}>
          <Dialog.Title>Update status</Dialog.Title>
          <Dialog.Content>
            <FormSelect
              control={control}
              name="status"
              label="Status"
              options={[{ label: 'Active', value: "1" },
              { label: 'Deceased', value: "2" },
              { label: 'Sold', value: "3" },
              { label: 'Transferred', value: "4" }

              ]} /></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(false)}>Cancel</Button>
            <Button onPress={handleSubmit(submitStatus)} loading={isSubmitting} disabled={isSubmitting}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}
