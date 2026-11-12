import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, HelperText } from 'react-native-paper';
import { FormTextField } from '@/components/FormTextField';
import { AuthScreenShell } from '@/features/auth/AuthScreenShell';
import { useAuth } from '@/providers/AuthProvider';
import { loginSchema, type LoginFormValues } from '@/schemas';
import { toApiError } from '@/services/api/errors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await signIn(values);
    } catch (e) {
      setError(toApiError(e).message);
    }
  };

  return (
    <AuthScreenShell title="Sign in">
      <FormTextField control={control} name="email" label="Email" keyboardType="email-address" autoComplete="email" />
      <FormTextField control={control} name="password" label="Password" secureTextEntry autoComplete="password" />
      {error ? <HelperText type="error" visible>{error}</HelperText> : null}
      <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} disabled={isSubmitting} contentStyle={{ minHeight: 48 }}>Sign in</Button>
      <Link href="/register" asChild><Button mode="text">Create an account</Button></Link>
    </AuthScreenShell>
  );
}
