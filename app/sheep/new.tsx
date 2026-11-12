import { useRouter } from 'expo-router';
import React from 'react';
import { Screen } from '@/components/Screen';
import { SheepForm } from '@/features/sheep/SheepForm';
import { useSnackbar } from '@/providers/SnackbarProvider';
import { useSync } from '@/providers/SyncProvider';
import { sheepRepository } from '@/repositories/sheepRepository';
import type { SheepFormValues } from '@/schemas';
import { toApiError } from '@/services/api/errors';
import type { CreateSheepRequest } from '@/types/api';
import { compact } from '@/utils/payload';

export default function NewSheepScreen() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { refreshPending } = useSync();

  const onSubmit = async (v: SheepFormValues) => {
    console.log('new sheep')
    const { tagNumber, ...rest } = v;
    console.log(tagNumber, rest)
    const payload: CreateSheepRequest = { tagNumber, ...compact(rest) };
    try {
      const result = await sheepRepository.create(payload);
      if (result.kind === 'queued') {
        await refreshPending();
        show(result.status === 'unconfirmed' ? 'No response from the server. Check "Sync queue" before sending again.' : 'Saved on this device. It will sync when you are back online.');
      } else {
        show('Sheep registered.');
      }
      router.back();
    } catch (e) {
      show(toApiError(e).message);
    }
  };

  return <Screen><SheepForm onSubmit={onSubmit} /></Screen>;
}
