/**
 * Backend DTOs.
 *
 * IMPORTANT: Swagger/OpenAPI could not be inspected while this project was generated.
 * Field names below are ASSUMPTIONS. Compare each interface with the backend's Swagger
 * schemas and adjust here only (all API/forms/cache code reads these types).
 * Fields marked optional are displayed only when the backend returns them.
 */
export type Id = string | number;

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { name: string; email: string; password: string }
export interface AuthTokens { accessToken: string; refreshToken: string }

export interface Sheep {
  id: Id;
  farmId: string;
  tagNumber?: string;
  name?: string;
  birthMonth?: string;
  birthYear?: string;
  sex?: string;
  status?: string;
  notes?: string;
  createdAt?: Date;
}
export interface CreateSheepRequest {
  tagNumber: string;
  farmId: string;
  name?: string;
  birthMoth?: string;
  birthYear?: number | null;
  sex?: string;
  status?: string;
  notes?: string;
}
export interface UpdateSheepStatusRequest { status: string }

export interface LookupDto {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
}
export interface CategoryDto {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
}

export interface Medication {
  id?: Id;
  name?: string;
  category?: string;
  administrationType?: string;
  treats?: string;
  notes?: string;
  standardDosage?: string;
  dosingFrequency?: string;
  withdrawalDays?: number | null;
}

export interface CreateMedicationRequestDto extends Omit<Medication, 'id'> { }

export interface MedicationRequestDto extends Omit<Medication, 'id'> { }

export interface UpdateMedicationStatusRequest { active: boolean }

export interface Treatment {
  id: Id;
  farmId: Id;
  sheepId: Id;
  medicationId: Id;
  administeredAt?: Date | string;
  doseAmount?: number;
  doseUnit?: string;
  notes?: string;
  administeredBy?: string;
  withdrawalDaysApplied?: number;
  withdrawalUntil: Date | string;
}
export interface CreateTreatmentRequest {
  farmId: Id;
  sheepId: Id;
  medicationId: Id;
  administeredAt?: Date | string;
  doseAmount?: number;
  doseUnit?: string;
  notes?: string;
  administeredBy?: string;
}
