import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Card } from 'react-native-paper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DetailRow } from '@/components/DetailRow';
import { PendingChip } from '@/components/PendingChip';
import { Screen } from '@/components/Screen';
import { StatusBanner } from '@/components/StatusBanner';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useResource } from '@/hooks/useResource';
import { useSnackbar } from '@/providers/SnackbarProvider';
import { medicationRepository } from '@/repositories/medicationRepository';
import { toApiError } from '@/services/api/errors';
import { commonStyles } from '@/theme/commonStyles';
import { useAuth } from '@/providers/AuthProvider';
import { convertAdministrationTypeOptions } from '@/utils/lookup';
import { lookupRepository } from '@/repositories/administrationTypesRepository';
import { LookupType } from '@/types/db';

export default function MedicationDetailScreen() {
  const { id: rawId, source } = useLocalSearchParams<{ id: string; source: string }>();
  const id = decodeURIComponent(String(rawId));
  const router = useRouter();
  const { show } = useSnackbar();
  const res = useResource(() => medicationRepository.get(id), `med-${id}`);
  const adminTypes = useResource(() => lookupRepository.getAdminType(id), `${LookupType.ADMINISTRATION_TYPE}-${id}`);
  const categories = useResource(() => lookupRepository.get(id), `${LookupType.CATEGORY_TYPE}-${id}`);
  const [confirm, setConfirm] = useState(false);
  const m = res.data;
  if (!m) return null;
  const isLocal = !!m._pendingOpId;
  const isActive = m.active !== false;

  const toggle = async () => {
    setConfirm(false);
    try {
      await medicationRepository.setActive(id, !isActive);
      show(isActive ? 'Medication deactivated.' : 'Medication activated.');
      await res.reload();
    } catch (e) {
      const err = toApiError(e);
      show(err.kind === 'network' || err.kind === 'timeout' ? 'This change needs a connection to the server.' : err.message);
    }
  };

  if (res.loading) return <LoadingView />;
  if (res.error?.includes('403')) useAuth().signOut();
  if (res.error && !res.data) return <ErrorView message={res.error} onRetry={res.reload} />;

  return (
    <Screen refreshing={res.refreshing} onRefresh={res.refresh}>
      <StatusBanner source={res.source} fetchedAt={res.fetchedAt} />
      <Card style={commonStyles.card}>
        <Card.Title title={m.name} subtitle={m.active === undefined ? undefined : isActive ? 'Active' : 'Inactive'} />
        <Card.Content style={{ gap: 12 }}>
          <PendingChip status={m?.standardDosage} />
          <DetailRow label="Dosage instructions" value={m.category} />
          <DetailRow label="Administration type" value={adminTypes.data?.find((t) => t.id === 1).name} />
          <DetailRow label="Dosing frequency" value={m.dosingFrequency} />
          <DetailRow label="Treats" value={m.treats} />
          <DetailRow label="Withdrawal period" value={m.withdrawalPeriodDays != null ? `${m.withdrawalPeriodDays} days` : undefined} />
          <DetailRow label="Notes" value={m.notes} />
        </Card.Content>
        <Card.Actions>
          <Button disabled={isLocal} onPress={() => router.push({ pathname: `/medications/edit/${encodeURIComponent(id)}`, params: { source: 'edit', }, })}>Edit</Button>
          <Button disabled={isLocal || m.active === undefined} onPress={() => setConfirm(true)}>{isActive ? 'Deactivate' : 'Activate'}</Button>
        </Card.Actions>
      </Card>
      <ConfirmDialog visible={confirm} title={isActive ? 'Deactivate medication?' : 'Activate medication?'} message={isActive ? 'Inactive medications can no longer be selected when recording treatments. Existing treatments are not changed.' : 'This medication will be available again when recording treatments.'} confirmLabel={isActive ? 'Deactivate' : 'Activate'} onConfirm={() => void toggle()} onDismiss={() => setConfirm(false)} />
    </Screen>
  );
}
