import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD');
const optionalIsoDate = z.string().trim().regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Use format YYYY-MM-DD');

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const sheepSchema = z.object({
  tagNumber: z.string().trim().min(1, 'Tag number is required'),
  farmId: z.string().trim().min(1, 'Farm is required'),
  birthMonth: z.string().trim().min(1, 'Birth month is required'),
  name: z.string().trim().min(1, 'Birth month is required'),
  birthYear: z.number().min(1, 'Birth year is required'),
  sex: z.string().trim().min(1, 'Gender is required'),
  status: z.string().trim().min(1, 'Status is required'),
  notes: z.string().trim(),
});
export type SheepFormValues = z.infer<typeof sheepSchema>;

export const medicationSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  category: z.string().trim(),
  administrationType: z.string().trim(),
  standardDosage: z.string().trim(),
  withdrawalDays: z.number().min(0, 'Withdrawal period must be 0 or more'),
  dosingFrequency: z.string().trim(),
  treats: z.string().trim(),
  notes: z.string().trim(),
});
export type MedicationFormValues = z.infer<typeof medicationSchema>;

export const treatmentSchema = z.object({
  sheepId: z.string().min(1, 'Select a sheep'),
  medicationId: z.string().min(1, 'Select a medication'),
  farmId: z.string().min(1, 'Select a farm'),
  administeredAt: z.string().min(1, 'Select a date'),
  doseAmount: z.number().min(0, 'Select a medication'),
  doseUnit: z.string().trim().min(1, 'Dosage is required'),
  administeredBy: z.string().trim().min(1, 'Administered by is required'),
  notes: z.string().trim(),
});
export type TreatmentFormValues = z.infer<typeof treatmentSchema>;

export const statusSchema = z.object({ status: z.string().trim().min(1, 'Status is required') });
export type StatusFormValues = z.infer<typeof statusSchema>;
