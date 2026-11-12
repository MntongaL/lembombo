import { zodResolver } from '@hookform/resolvers/zod';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from 'react-native-paper';
import { FormTextField } from '@/components/FormTextField';
import { medicationSchema, type MedicationFormValues } from '@/schemas';
import type { MedicationRequestDto } from '@/types/api';
import { compact } from '@/utils/payload';
import { lookupRepository } from '@/repositories/administrationTypesRepository';
import { useResource } from '@/hooks/useResource';
import { FormSelect } from '@/components/FormSelect';
import { FormNumberField } from '@/components/FormNumberField';
import { convertAdministrationTypeOptions } from '@/utils/lookup';
import { LookupType } from '@/types/db';

export function toMedicationRequest(m: MedicationFormValues): MedicationRequestDto {
  console.log('toMedicationRequest', m);
  return {
    name: m.name,
    administrationType: m.administrationType ?? '',
    category: m.category ?? '',
    standardDosage: m.standardDosage ?? '',
    withdrawalDays: m.withdrawalDays ?? '',
    treats: m.treats ?? '',
    dosingFrequency: m.dosingFrequency ?? '',
    notes: m.notes ?? ''
  };
}

interface Props {
  initial?: Partial<MedicationFormValues>;
  submitLabel: string;
  onSubmit: (values: MedicationFormValues) => Promise<void>;
}

export function MedicationForm({ initial, submitLabel, onSubmit }: Props) {

  const adminTypes = useResource(() => lookupRepository.administrationLookupItems(), LookupType.ADMINISTRATION_TYPE);
  const categoryTypes = useResource(() => lookupRepository.categoryLookupItems(), LookupType.CATEGORY_TYPE);
  const { control, formState: { isSubmitting } } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: { ...(initial ?? {}) },
  });

  const adminTypeById = useMemo(() => new Map((adminTypes.data ?? []).map((a) => [String(a.id), a])), [adminTypes.data]);
  const categoryTypeById = useMemo(() => new Map((categoryTypes.data ?? []).map((a) => [String(a.id), a])), [categoryTypes.data]);

  return (
    <>
      <FormTextField control={control} name="name" label="Product name *" autoCapitalize="words" />
      <FormSelect
        control={control}
        name="category"
        label="Category"
        value={control._formValues.category}
        options={Array.from(categoryTypeById.values()).map((a) => ({ label: a.name, value: String(a.id) }))}
      />
      <FormSelect
        control={control}
        name="administrationType"
        value={control._formValues.administrationType}
        label="Administration Type"
        placeholder="Select an administration type"
        options={Array.from(adminTypeById.values()).map((a) => ({ label: a.name, value: String(a.id) }))} />
      <FormTextField
        control={control}
        name="standardDosage"
        label="Standard Dosage"
        multiline
        numberOfLines={5}
        autoCapitalize="sentences"
      />
      <FormNumberField
        control={control}
        name="withdrawalDays"
        label="Withdrawal Days"
      />
      <FormTextField
        control={control}
        name="dosingFrequency"
        label="Dosing Frequency"
        multiline
        numberOfLines={5}
        autoCapitalize="sentences"
      />
      <FormTextField control={control} name="treats" label="Treats" multiline numberOfLines={5} autoCapitalize="sentences" />
      <FormTextField control={control} name="notes" label="Notes" multiline numberOfLines={5} autoCapitalize="sentences" />
      <Button
        mode="contained"
        onPress={() => {
          onSubmit({
            name: control._formValues.name,
            category: control._formValues.category,
            administrationType: control._formValues.administrationType,
            treats: control._formValues.treats,
            notes: control._formValues.notes,
            standardDosage: control._formValues.standardDosage,
            dosingFrequency: control._formValues.dosingFrequency,
            withdrawalDays: control._formValues.withdrawalDays
          })
        }}
        loading={isSubmitting}
        disabled={isSubmitting}
        contentStyle={{ minHeight: 48 }}>{submitLabel}
      </Button>
    </>
  );
}
