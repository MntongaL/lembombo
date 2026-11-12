import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Card, Chip } from 'react-native-paper';
import { DetailRow } from '@/components/DetailRow';
import { PendingChip } from '@/components/PendingChip';
import { Screen } from '@/components/Screen';
import { StatusBanner } from '@/components/StatusBanner';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useResource } from '@/hooks/useResource';
import { medicationRepository } from '@/repositories/medicationRepository';
import { treatmentRepository } from '@/repositories/treatmentRepository';
import { commonStyles } from '@/theme/commonStyles';
import { formatDate, formatDateObj, formatDateTime } from '@/utils/date';
import { withdrawalEnd, withdrawalFor } from '@/utils/treatmentWithdrawal';
import { LookupType } from '@/types/db';
import { sheepRepository } from '@/repositories/sheepRepository';

export default function TreatmentDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(String(rawId));
  const res = useResource(() => treatmentRepository.get(id), `${LookupType.TREATMENT}-${id}`);
  const meds = useResource(() => medicationRepository.list(), `${LookupType.TREATMENT}-${id}-meds`);
  const sheep = useResource(() => sheepRepository.list(), LookupType.SHEEP);

  const medById = useMemo(() => new Map((meds.data ?? []).map((m) => [String(m.id), m])), [meds.data]);
  const sheepById = useMemo(() => new Map((sheep.data ?? []).map((m) => [String(m.id), m])), [sheep.data]);

  if (res.loading) return <LoadingView />;
  if (res.error && !res.data) return <ErrorView message={res.error} onRetry={res.reload} />;
  const t = res.data;
  if (!t) return null;
  const med = (meds.data ?? []).find((m) => String(m.id) === String(t.medicationId));
  const w = withdrawalFor(t, med);
  return (
    <Screen refreshing={res.refreshing} onRefresh={res.refresh}>
      <StatusBanner source={res.source} fetchedAt={res.fetchedAt} />
      <Card style={commonStyles.card}>
        <Card.Title title={med?.name ?? String(t.medicationId)} subtitle={String('Administered by:') + (t.administeredBy)} />
        <Card.Content style={{ gap: 12 }}>
          <PendingChip status={t._pendingStatus} />
          <DetailRow label="Sheep" value={sheepById.get(String(t.sheepId))?.tagNumber} />
          <DetailRow label="Medication" value={medById.get(String(t.medicationId))?.name ?? String(t.medicationId)} />
          <DetailRow label="Dosage given" value={t?.doseAmount} />
          <DetailRow label="Dosage unit" value={t?.doseUnit} />
          <DetailRow label="Treatment date" value={formatDateTime(String(t.administeredAt))} />
          <DetailRow label="Withdrawal Period" value={t?.withdrawalDaysApplied} />
          <DetailRow label="Withdrawal End Date" value={String(withdrawalEnd(String(t?.administeredAt), med?.withdrawalDays))} />
          <DetailRow label="Administration Type" value={med?.administrationType} />
          <DetailRow label="Category" value={med?.category} />
          <DetailRow label="Dosing Frequency" value={med?.dosingFrequency} />
          <DetailRow label="Notes" value={t.notes} />
          {w.end ? <Chip icon={w.active ? 'alert-outline' : 'check-circle-outline'}>{w.active ? `Withdrawal until ${formatDateObj(w.end)}` : `Withdrawal ended ${formatDateObj(w.end)}`}</Chip> : null}
        </Card.Content>
      </Card>
    </Screen>
  );
}
