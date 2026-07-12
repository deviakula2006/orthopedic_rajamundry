import { z } from 'zod';

const BILL_TYPE = ['OPD', 'IPD', 'Pharmacy', 'Lab'];
const PAYMENT_MODE = ['Cash', 'Card', 'UPI', 'Insurance', 'Net Banking'];
const PAYMENT_STATUS = ['Paid', 'Pending', 'Partially Paid', 'Refunded'];
const BILL_ITEM_TYPE = ['Consultation', 'Investigation', 'Therapy', 'Pharmacy', 'Room Rent', 'Procedure', 'Other'];

const billItemSchema = z.object({
  description: z.string().min(1).max(200),
  itemType: z.enum(BILL_ITEM_TYPE),
  quantity: z.coerce.number().int().positive().optional(),
  amount: z.coerce.number().nonnegative(),
  investigationId: z.string().uuid().optional()
});

export const createBillSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid().optional(),
  billDate: z.string().date().optional(),
  billType: z.enum(BILL_TYPE),
  paymentMode: z.enum(PAYMENT_MODE).optional(),
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  discount: z.coerce.number().nonnegative().optional(),
  tax: z.coerce.number().nonnegative().optional(),
  items: z.array(billItemSchema).min(1, 'At least one line item is required')
});

export const updateBillStatusSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUS),
  paymentMode: z.enum(PAYMENT_MODE).optional()
});

export const listBillsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  patientId: z.string().uuid().optional(),
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  billType: z.enum(BILL_TYPE).optional()
});
