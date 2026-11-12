import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from 'react-native-paper';
import { FormTextField } from '@/components/FormTextField';
import { FormSelect } from '@/components/FormSelect';
import { FormNumberField } from '@/components/FormNumberField';
import { sheepSchema, type SheepFormValues } from '@/schemas';
import { FormMonthSelect } from '@/components/FormMonthSelect';
import { getMonthOptions, todayIso } from '@/utils/date';

interface Props { onSubmit: (values: SheepFormValues) => Promise<void>; submitLabel?: string }

export function SheepForm({ onSubmit, submitLabel = 'Register sheep' }: Props) {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<SheepFormValues>({
    resolver: zodResolver(sheepSchema),
    defaultValues: { tagNumber: '', birthMonth: '', birthYear: new Date().getFullYear(), sex: '', status: '', notes: '', name: '' },
  });

  control.register('farmId', { value: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });

  return (
    <>
      <FormTextField control={control} name="tagNumber" label="Tag number *" />
      <FormTextField control={control} name="name" label="Name given" />
      <FormSelect control={control} name="birthMonth" label="Birth month" options={getMonthOptions()} />
      <FormNumberField control={control} name="birthYear" label="Birth year" />
      <FormSelect
        control={control}
        name="sex"
        label="Gender"
        options={[
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
        ]}
      />
      <FormTextField control={control} name="notes" label="Notes" multiline numberOfLines={3} autoCapitalize="sentences" />
      <Button mode="contained" onPress={() => { onSubmit(control._formValues) }}
        loading={isSubmitting} disabled={isSubmitting} contentStyle={{ minHeight: 48 }}>{submitLabel}</Button>
    </>
  );
}
