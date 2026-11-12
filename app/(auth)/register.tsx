import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, HelperText } from 'react-native-paper';
import { FormTextField } from '@/components/FormTextField';
import { AuthScreenShell } from '@/features/auth/AuthScreenShell';
import { useAuth } from '@/providers/AuthProvider';
import { registerSchema, type RegisterFormValues } from '@/schemas';
import { toApiError } from '@/services/api/errors';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (v: RegisterFormValues) => {
    setError(null);
    try {
      await register({ name: v.name, email: v.email, password: v.password });
    } catch (e) {
      setError(toApiError(e).message);
    }
  };

  return (
    <AuthScreenShell title="Create account">
      <FormTextField control={control} name="name" label="Full name" autoCapitalize="words" />
      <FormTextField control={control} name="email" label="Email" keyboardType="email-address" autoComplete="email" />
      <FormTextField control={control} name="password" label="Password" secureTextEntry />
      <FormTextField control={control} name="confirmPassword" label="Confirm password" secureTextEntry />
      {error ? <HelperText type="error" visible>{error}</HelperText> : null}
      <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} disabled={isSubmitting} contentStyle={{ minHeight: 48 }}>Register</Button>
      <Link href="/login" asChild><Button mode="text">I already have an account</Button></Link>
    </AuthScreenShell>
  );
}
