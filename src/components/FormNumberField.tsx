import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';
import { commonStyles } from '@/theme/commonStyles';
function parseNumberText(text: string): number | undefined {
  const normalized = text.trim().replace(',', '.');
  if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') return undefined;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

function sanitizeNumberText(text: string, options: { allowDecimal?: boolean; allowNegative?: boolean }): string {
  const { allowDecimal, allowNegative } = options;
  let result = '';
  let hasDecimal = false;

  for (const character of text) {
    if (character >= '0' && character <= '9') {
      result += character;
    } else if (allowDecimal && (character === '.' || character === ',') && !hasDecimal) {
      result += character;
      hasDecimal = true;
    } else if (allowNegative && character === '-' && result.length === 0) {
      result += character;
    }
  }

  return result;
}

function clampNumber(value: number, min?: number, max?: number): number {
  return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));
}

function stepNumber(value: number, delta: number, min?: number, max?: number): number {
  return clampNumber(value + delta, min, max);
}

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  /** Allow a decimal part (accepts "." or ","). Default: whole numbers only. */
  allowDecimal?: boolean;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  /** When set, shows − / + buttons that change the value by this amount. */
  step?: number;
  /** Shown in the label, e.g. "kg" gives "Weight (kg)". */
  unit?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'error' | 'label' | 'keyboardType' | 'left' | 'right'>;

/** Form value is `number | undefined` (undefined when the field is empty). */
export function FormNumberField<T extends FieldValues>({ control, name, label, allowDecimal, allowNegative, min, max, step, unit, ...rest }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <NumberInputView
          label={unit ? `${label} (${unit})` : label}
          value={typeof value === 'number' ? value : undefined}
          onChange={onChange}
          onBlur={onBlur}
          error={error?.message}
          allowDecimal={allowDecimal}
          allowNegative={allowNegative}
          min={min}
          max={max}
          step={step}
          inputProps={rest}
        />
      )}
    />
  );
}

interface ViewProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
  error?: string;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  step?: number;
  inputProps: Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'error' | 'label' | 'keyboardType' | 'left' | 'right'>;
}

function NumberInputView({ label, value, onChange, onBlur, error, allowDecimal, allowNegative, min, max, step, inputProps }: ViewProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value));

  // Re-sync the text only when the form value changes from outside (reset, setValue, stepper).
  useEffect(() => {
    if (parseNumberText(text) !== value) setText(value === undefined ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (raw: string) => {
    const clean = sanitizeNumberText(raw, { allowDecimal, allowNegative });
    setText(clean);
    onChange(parseNumberText(clean));
  };

  const handleBlur = () => {
    const parsed = parseNumberText(text);
    if (parsed === undefined) {
      setText('');
      onChange(undefined);
    } else {
      const clamped = clampNumber(parsed, min, max);
      setText(String(clamped));
      if (clamped !== parsed) onChange(clamped);
    }
    onBlur();
  };

  const bump = (delta: number) => {
    const base = parseNumberText(text) ?? (min !== undefined && min > 0 ? min : 0);
    const next = stepNumber(base, delta, min, max);
    setText(String(next));
    onChange(next);
  };

  // iOS's decimal/number pads have no minus key; this keyboard does. Android falls back to its default keyboard.
  const keyboardType: TextInputProps['keyboardType'] = allowNegative
    ? Platform.select({ ios: 'numbers-and-punctuation', default: 'numeric' })
    : allowDecimal
      ? 'decimal-pad'
      : 'number-pad';

  return (
    <View style={commonStyles.field}>
      <TextInput
        mode="outlined"
        label={label}
        value={text}
        onChangeText={handleChange}
        onBlur={handleBlur}
        error={!!error}
        keyboardType={keyboardType}
        left={step !== undefined ? <TextInput.Icon icon="minus" onPress={() => bump(-step)} accessibilityLabel="Decrease" /> : undefined}
        right={step !== undefined ? <TextInput.Icon icon="plus" onPress={() => bump(step)} accessibilityLabel="Increase" /> : undefined}
        {...inputProps}
      />
      {error ? <HelperText type="error" visible>{error}</HelperText> : null}
    </View>
  );
}