import { useRouter } from 'expo-router';
import React from 'react';
import { Screen } from '@/components/Screen';
import { MedicationForm, toMedicationRequest } from '@/features/medication/MedicationForm';
import { useSnackbar } from '@/providers/SnackbarProvider';
import { useSync } from '@/providers/SyncProvider';
import { medicationRepository } from '@/repositories/medicationRepository';
import type { MedicationFormValues } from '@/schemas';
import { toApiError } from '@/services/api/errors';

export default function NewMedicationScreen() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { refreshPending } = useSync();

  const onSubmit = async (v: MedicationFormValues) => {
    try {
      console.log('NewMedicationScreen', 'onSubmit', v);
      const result = await medicationRepository.create(toMedicationRequest(v));
      if (result.kind === 'queued') {
        await refreshPending();
        show(result.status === 'unconfirmed' ? 'No response from the server. Check "Sync queue" before sending again.' : 'Saved on this device. It will sync when you are back online.');
      } else {
        show('Medication added.');
      }
      router.back();
    } catch (e) {
      show(toApiError(e).message);
    }
  };

  return <Screen><MedicationForm submitLabel="Add medication" onSubmit={onSubmit} /></Screen>;
}
