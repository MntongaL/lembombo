import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { MedicationForm, toMedicationRequest } from '@/features/medication/MedicationForm';
import { useResource } from '@/hooks/useResource';
import { useSnackbar } from '@/providers/SnackbarProvider';
import { medicationRepository } from '@/repositories/medicationRepository';
import type { MedicationFormValues } from '@/schemas';
import { toApiError } from '@/services/api/errors';
import { useAuth } from '@/providers/AuthProvider';

export default function EditMedicationScreen() {
  const { id: rawId, source } = useLocalSearchParams<{ id: string; source: string }>();
  const id = decodeURIComponent(String(rawId));
  const router = useRouter();
  const { show } = useSnackbar();
  const res = useResource(() => medicationRepository.get(id), `med-edit-${id}`);

  const m = res.data;
  if (!m) return null;

  const onSubmit = async (v: MedicationFormValues) => {
    try {
      console.log('EditMedicationScreen', 'onSubmit', v);
      const medicationRequest = toMedicationRequest(v);
      console.log('EditMedicationScreen', 'onSubmit', medicationRequest);
      await medicationRepository.update(id, medicationRequest);
      show('Medication updated.');
      router.back();
    } catch (e) {
      const err = toApiError(e);
      show(err.kind === 'network' || err.kind === 'timeout' ? 'Editing needs a connection to the server. Nothing was changed.' : err.message);
    }
  };

  if (res.loading) return <LoadingView />;
  if (res.error && !res.data) return <ErrorView message={res.error} onRetry={res.reload} />;
  if (res.error?.includes('403')) useAuth().signOut();

  return (
    <Screen>
      <MedicationForm
        submitLabel="Save changes"
        onSubmit={onSubmit}
        initial={{
          name: m.name,
          administrationType: m.administrationType ?? '',
          category: m.category ?? '',
          standardDosage: m.standardDosage ?? '',
          withdrawalDays: m.withdrawalDays ?? '',
          treats: m.treats ?? '',
          dosingFrequency: m.dosingFrequency ?? '',
          notes: m.notes ?? ''
        }}
      />
    </Screen>
  );
}
