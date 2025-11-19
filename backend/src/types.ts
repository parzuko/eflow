import { z } from "@hono/zod-openapi";

// --- Fulfil (ERP) Types ---

export const ErpAddressSchema = z.object({
  name: z.string(),
  address1: z.string(),
  address2: z.string().nullable().optional(),
  businessName: z.string().nullable().optional(),
  city: z.string(),
  zip: z.string(),
  countryCode: z.string(),
  subdivisionCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const ErpOrderLineProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  hsCode: z.string().nullable().optional(),
});

export const ErpOrderSublineSchema = z.object({
  id: z.number(),
  product: ErpOrderLineProductSchema,
  quantity: z.number(),
});

export const ErpOrderLineSchema = z.object({
  id: z.number(),
  product: ErpOrderLineProductSchema,
  quantity: z.number(),
  currency: z.string(),
  unitCustomsValue: z.number(),
  sublines: z.array(ErpOrderSublineSchema).optional(),
});

export const ErpOrderInputSchema = z.object({
  erpOrderId: z.string(),
  organizationId: z.string(),
  channelId: z.string(),
  deliveryAddress: ErpAddressSchema,
  lines: z.array(ErpOrderLineSchema),
});

export type ErpOrderInput = z.infer<typeof ErpOrderInputSchema>;

// --- Mabang (WMS) Types ---

export const MabangOrderRecordSchema = z.object({
  id: z.string(),
  platformOrderId: z.string().nullable().optional(),
  shopId: z.string(),
  createDate: z.date(), // or string if JSON
  orderStatus: z.string().nullable().optional(),
  trackNumber: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  issueStatus: z.enum(["NO_ISSUE", "UNRESOLVED", "RESOLVED"]),
  isManualHold: z.boolean(),
});

export type MabangOrderRecord = z.infer<typeof MabangOrderRecordSchema>;

export const MabangOrderItemRecordSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  mabangSKU: z.string().nullable().optional(),
  quantity: z.number(),
  platformSku: z.string().nullable().optional(),
  erpOrderItemId: z.string().nullable().optional(),
});

export type MabangOrderItemRecord = z.infer<typeof MabangOrderItemRecordSchema>;

// --- Ecomflow Internal Types ---

export const SyncStateSchema = z.enum([
  "PENDING_SYNC",
  "SENT_TO_WMS",
  "ACKNOWLEDGED_BY_WMS",
  "FAILED",
  "DEAD_LETTER",
]);
export type SyncState = z.infer<typeof SyncStateSchema>;

export const OrderSyncRecordSchema = z.object({
  ecomflowOrderId: z.string(), // UUID
  erpOrderId: z.string(),
  mabangOrderId: z.string().optional(),
  state: SyncStateSchema,
  lastError: z.string().optional(),
  retryCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  erpPayload: ErpOrderInputSchema, // Store original payload for retry/debug
});

export type OrderSyncRecord = z.infer<typeof OrderSyncRecordSchema>;

export const ReconciliationSummarySchema = z.object({
  inSync: z.number(),
  onlyInErp: z.number(),
  onlyInWms: z.number(),
  statusMismatch: z.number(),
  failed: z.number(),
  mismatches: z.number(),
});

export type ReconciliationSummary = z.infer<typeof ReconciliationSummarySchema>;
