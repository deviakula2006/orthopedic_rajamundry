import { z } from 'zod';

export const updateConsultationSchema = z.object({
  symptoms: z.string().optional(),
  clinicalNotes: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  followUpAdvice: z.string().optional(),
  remarks: z.string().optional()
});

export const completeConsultationSchema = z.object({
  symptoms: z.string().optional(),
  clinicalNotes: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  followUpAdvice: z.string().optional(),
  remarks: z.string().optional()
});

export const createVitalsSchema = z
  .object({
    patientId: z.string().uuid(),
    appointmentId: z.string().uuid().optional(),
    consultationId: z.string().uuid().optional(),
    bpSystolic: z.number().int().min(30).max(300).optional(),
    bpDiastolic: z.number().int().min(20).max(200).optional(),
    bpText: z.string().max(20).optional(),
    pulse: z.number().int().min(20).max(250).optional(),
    temperature: z.number().min(80).max(115).optional(),
    weight: z.number().min(0.5).max(400).optional(),
    height: z.number().min(20).max(300).optional(),
    spo2: z.number().int().min(50).max(100).optional(),
    bloodSugar: z.number().int().min(20).max(1000).optional(),
    bmi: z.number().min(5).max(100).optional()
  })
  .refine(
    (data) => Boolean((data.bpText && data.bpText.trim().length > 0) || (data.bpSystolic !== undefined && data.bpDiastolic !== undefined)),
    {
      message: 'Blood pressure is required',
      path: ['bpText']
    }
  );

export const createPrescriptionSchema = z.object({
  consultationId: z.string().uuid(),
  medicineName: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  duration: z.string().min(1).max(100),
  instructions: z.string().optional()
});

export const createPrescriptionsBatchSchema = z.object({
  consultationId: z.string().uuid(),
  prescriptions: z.array(z.object({
    medicineName: z.string().min(1).max(200),
    dosage: z.string().min(1).max(100),
    frequency: z.string().min(1).max(100),
    duration: z.string().min(1).max(100),
    instructions: z.string().optional()
  })).min(1)
});

export const orderInvestigationSchema = z
  .object({
    consultationId: z.string().uuid().optional(),
    patientId: z.string().uuid().optional(),
    appointmentId: z.string().uuid().optional(),
    investigationId: z.string().uuid().optional(),
    testName: z.string().min(1).max(200).optional()
  })
  .refine((data) => data.consultationId || data.patientId || data.appointmentId, {
    message: 'Either consultationId, patientId, or appointmentId must be provided'
  })
  .refine((data) => data.investigationId || data.testName, {
    message: 'Either investigationId or testName must be provided'
  });

export const orderInvestigationsBatchSchema = z
  .object({
    consultationId: z.string().uuid().optional(),
    patientId: z.string().uuid().optional(),
    appointmentId: z.string().uuid().optional(),
    investigationIds: z.array(z.string().uuid()).min(1, 'Select at least one investigation')
  })
  .refine((data) => data.consultationId || data.patientId || data.appointmentId, {
    message: 'Either consultationId, patientId, or appointmentId must be provided'
  });
