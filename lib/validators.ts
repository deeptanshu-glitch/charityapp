import { z } from 'zod';

export const RoleEnum = z.enum(['donor', 'volunteer', 'admin']);
export type Role = z.infer<typeof RoleEnum>;

// Authentication Validators
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['donor', 'volunteer']).default('donor'),
});

// Inventory Allocation Validator
export const AllocateStockSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  itemId: z.string().uuid('Invalid item ID'),
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  notes: z.string().max(500).optional(),
});

// Inter-Warehouse Transfer Validator
export const TransferStockSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  fromWarehouseId: z.string().uuid('Invalid source warehouse ID'),
  toWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  quantity: z.number().int().positive('Transfer quantity must be greater than zero'),
  reason: z.string().min(3, 'Transfer reason is required').max(255),
}).refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
  message: 'Source and destination warehouses cannot be the same',
  path: ['toWarehouseId'],
});

// Donation Contribution Validator
export const CreateDonationSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  amount: z.number().positive('Donation amount must be greater than 0'),
  description: z.string().min(3, 'Description is required').max(255),
});

// Disbursement Request Validator
export const CreateDisbursementSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  amount: z.number().positive('Disbursement amount must be greater than 0'),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
});

export const ReviewDisbursementSchema = z.object({
  requestId: z.string().uuid('Invalid disbursement request ID'),
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().max(500).optional(),
});
