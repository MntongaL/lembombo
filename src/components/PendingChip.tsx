import React from 'react';
import { Chip } from 'react-native-paper';
import type { PendingStatus } from '@/types/app';

const LABEL: Record<PendingStatus, string> = {
  pending: 'Waiting to sync',
  syncing: 'Syncing…',
  unconfirmed: 'Needs review',
  conflict: 'Conflict',
  rejected: 'Rejected',
};

export function PendingChip({ status }: { status?: PendingStatus }) {
  if (!status) return null;
  return <Chip compact icon="cloud-upload-outline" style={{ alignSelf: 'flex-start' }}>{LABEL[status]}</Chip>;
}
