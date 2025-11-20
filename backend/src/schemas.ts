import { z } from "@hono/zod-openapi";
import { ErpOrderInputSchema } from "./types.js";

// Schemas for responses
export const SystemHealthSchema = z.object({
  erp: z.enum(["UP", "DOWN"]),
  wms: z.enum(["UP", "DOWN"]),
  queue: z.object({
    status: z.enum(["UP", "DOWN"]),
    length: z.number(),
  }),
  jobs: z.object({
    sync: z.boolean(),
    reconcile: z.boolean(),
  }),
});

export const ToggleJobSchema = z.object({
  enabled: z.boolean(),
});

export const DetailedReconciliationSchema = z.array(
  z.object({
    erpOrderId: z.string(),
    issue: z.string(),
    details: z.string().optional(),
  })
);

export const OrderListSchema = z.array(
  z.object({
    erpOrderId: z.string(),
    customer: z.string(),
    status: z.string(),
    mabangId: z.string(),
    lastError: z.string().optional(),
    retryCount: z.number(),
  })
);

export const FailedOrderListSchema = z.array(
  z.object({
    ecomflowOrderId: z.string(),
    erpOrderId: z.string(),
    lastError: z.string(),
    retryCount: z.number(),
    createdAt: z.string(), // Date as string
  })
);

export const SuccessSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const InjectOrderSchema = ErpOrderInputSchema.extend({
  scenario: z
    .enum(["NORMAL", "FAIL_RANDOM", "FAIL_HARD", "DUPLICATE"])
    .optional(),
});
