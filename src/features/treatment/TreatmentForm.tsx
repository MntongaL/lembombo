import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { Button, HelperText } from 'react-native-paper';
import { EntityPicker, type PickerOption } from '@/components/EntityPicker';
import { FormTextField } from '@/components/FormTextField';
import { treatmentSchema, type TreatmentFormValues } from '@/schemas';
import type { Medication, Sheep } from '@/types/api';
import { formatDateObj, parseIsoDate, todayIso } from '@/utils/date';
import { FormNumberField } from '@/components/FormNumberField';
import { FormSelect } from '@/components/FormSelect';
import { useResource } from '@/hooks/useResource';
import { sheepRepository } from '@/repositories/sheepRepository';
import { LoadingView, ErrorView } from '@/components/StateViews';
import { withdrawalEnd } from '@/utils/treatmentWithdrawal';

interface Props {
  sheep: Sheep[];
  medications: Medication[];
  initialSheepId?: string;
  initialMedicationId?: string;
  onSubmit: (values: TreatmentFormValues) => Promise<void>;
}

const doseUnitOptions = [
  { label: 'mL', value: 'mL' },
  { label: 'mg', value: 'mg' },
  { label: 'g', value: 'g' },
  { label: 'tablet', value: 'tablet' },
  { label: 'bolus', value: 'bolus' },
];

const withdrawalUnitOptions = [
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
  { label: 'Months', value: 'months' },
];

export function TreatmentForm({ sheep, medications, initialSheepId, initialMedicationId, onSubmit }: Props) {
  const { control, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: { sheepId: initialSheepId ?? '', medicationId: initialMedicationId ?? '', farmId: '', administeredAt: todayIso(), notes: '', doseAmount: 0, doseUnit: '', administeredBy: '' },
  });
  const onInvalid = (formErrors: FieldErrors<TreatmentFormValues>) => {
    console.log('Form validation failed:', formErrors);
  };

  const res = useResource(() => sheepRepository.list(), 'sheep-list');


  const farmId = res.data?.find((s) => String(s.id) === watch('sheepId'))?.farmId;
  control.register('farmId', { value: farmId ?? '' });

  const submitForm = handleSubmit(onSubmit, onInvalid);

  const sheepOptions: PickerOption[] = useMemo(
    () => sheep.map((s) => ({ id: String(s.id), title: s.tagNumber ?? s.name ?? String(s.id), description: s.status })),
    [sheep],
  );
  const medOptions: PickerOption[] = useMemo(
    () => medications.map((m) => ({ id: String(m.id), title: m.name, description: m.treats })),
    [medications],
  );

  const medId = watch('medicationId');
  const date = watch('administeredAt');
  const med = medications.find((m) => String(m.id) === medId);

  const end = parseIsoDate(control._formValues.administeredAt) ? withdrawalEnd(date, med?.withdrawalDays) : null;

  useEffect(() => {
    setValue('farmId', farmId ?? '', { shouldValidate: true });
  }, [farmId, setValue]);
  if (res.loading) return <LoadingView />;
  if (res.error) return <ErrorView message={res.error} onRetry={res.reload} />;
  return (
    <>
      <Controller control={control} name="sheepId" render={({ field, fieldState }) => (
        <EntityPicker label="Sheep" value={field.value} options={sheepOptions} onChange={field.onChange} error={fieldState.error?.message} emptyText="No synced sheep available" />
      )} />
      <Controller control={control} name="medicationId" render={({ field, fieldState }) => (
        <EntityPicker label="Medication" value={field.value} options={medOptions} onChange={field.onChange} error={fieldState.error?.message} emptyText="No active medications available" />
      )} />
      {med?.name ? <HelperText type="info" visible>Dosage instructions: {med.standardDosage}</HelperText> : null}
      <FormNumberField control={control} name="doseAmount" label="Dosage given *" />
      <FormSelect control={control} name="doseUnit" label="Dose unit *" options={doseUnitOptions} />
      <FormTextField control={control} name="administeredBy" label="Administered by *" />
      <FormTextField control={control} name="administeredAt" label="Treatment date (YYYY-MM-DD) *" keyboardType="numbers-and-punctuation" />
      {end ? <HelperText type="info" visible>Withdrawal period ends {formatDateObj(end)}.</HelperText> : null}
      <FormTextField control={control} name="notes" label="Notes" multiline numberOfLines={5} autoCapitalize="sentences" />
      <Button mode="contained" onPress={submitForm} loading={isSubmitting} disabled={isSubmitting} contentStyle={{ minHeight: 48 }}>Record treatment</Button>
    </>
  );
}
