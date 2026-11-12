import React from 'react';
import { View } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';
import { commonStyles } from '@/theme/commonStyles';

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'error' | 'label'>;

export function FormTextField<T extends FieldValues>({ control, name, label, ...rest }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={commonStyles.field}>
          <TextInput mode="outlined" label={label} value={String(value ?? '')} onChangeText={onChange} onBlur={onBlur} error={!!error} autoCapitalize="none" {...rest} />
          {error?.message ? <HelperText type="error" visible>{error.message}</HelperText> : null}
        </View>
      )}
    />
  );
}
