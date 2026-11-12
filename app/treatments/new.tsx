import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { StatusBanner } from '@/components/StatusBanner';
import { TreatmentForm } from '@/features/treatment/TreatmentForm';
import { useResource } from '@/hooks/useResource';
import { useSnackbar } from '@/providers/SnackbarProvider';
import { useSync } from '@/providers/SyncProvider';
import { medicationRepository } from '@/repositories/medicationRepository';
import { sheepRepository } from '@/repositories/sheepRepository';
import { treatmentRepository } from '@/repositories/treatmentRepository';
import type { TreatmentFormValues } from '@/schemas';
import { toApiError } from '@/services/api/errors';
import type { CreateTreatmentRequest } from '@/types/api';
import { compact } from '@/utils/payload';

export default function NewTreatmentScreen() {
  const { sheepId, medicationId } = useLocalSearchParams<{ sheepId?: string; medicationId?: string }>();
  const router = useRouter();
  const { show } = useSnackbar();
  const { refreshPending } = useSync();
  const sheep = useResource(() => sheepRepository.list(), 'new-treatment-sheep');
  const meds = useResource(() => medicationRepository.list(), 'new-treatment-meds');
  if (sheep.loading || meds.loading) return <LoadingView />;
  if ((sheep.error && !sheep.data) || (meds.error && !meds.data)) return <ErrorView message={sheep.error ?? meds.error ?? 'Could not load data'} onRetry={() => { void sheep.reload(); void meds.reload(); }} />;

  // Only records that already exist on the server can be referenced; pending local records have no server id yet.
  const sheepOptions = (sheep.data ?? []).filter((s) => !s._pendingOpId);
  const medOptions = (meds.data ?? []).filter((m) => !m._pendingOpId && m.active !== false);

  const onSubmit = async (v: TreatmentFormValues) => {
    const payload: CreateTreatmentRequest = {
      sheepId: v.sheepId,
      medicationId: v.medicationId,
      farmId: v.farmId,
      administeredAt: v.administeredAt,
      doseAmount: v.doseAmount,
      doseUnit: v.doseUnit,
      notes: v.notes,
      administeredBy: v.administeredBy,
      ...compact({ notes: v.notes }),
    };
    try {
      const result = await treatmentRepository.create(payload);
      if (result.kind === 'queued') {
        await refreshPending();
        show(result.status === 'unconfirmed' ? 'No response from the server. Check "Sync queue" before sending again.' : 'Saved on this device. It will sync when you are back online.');
      } else {
        show('Treatment recorded.');
      }
      router.back();
    } catch (e) {
      show(toApiError(e).message);
    }
  };

  return (
    <Screen>
      <StatusBanner source={sheep.source ?? meds.source} fetchedAt={sheep.fetchedAt} />
      <TreatmentForm
        sheep={sheepOptions}
        medications={medOptions}
        initialSheepId={sheepId}
        initialMedicationId={medicationId}
        onSubmit={onSubmit} />
    </Screen>
  );
}
