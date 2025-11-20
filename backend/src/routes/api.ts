import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  DetailedReconciliationSchema,
  FailedOrderListSchema,
  InjectOrderSchema,
  OrderListSchema,
  SuccessSchema,
  SystemHealthSchema,
  ToggleJobSchema,
} from "../schemas.js";
import { db } from "../store.js";
import { fulfilService } from "../services/erp.js";
import { reconciliationService } from "../services/reconciliation.js";
import { orchestrator } from "../services/orchestrator.js";
import { ReconciliationSummarySchema } from "../types.js";
import { schedulerService } from "../services/scheduler.js";
import { queueService } from "../services/queue.js";

const api = new OpenAPIHono();

api.openapi(
  createRoute({
    method: "get",
    path: "/api/orders",
    tags: ["Internal"],
    responses: {
      200: {
        description: "List all orders",
        content: {
          "application/json": {
            schema: OrderListSchema,
          },
        },
      },
    },
  }),
  (c) => {
    const allErpOrders = Array.from(db.erpOrders.values());
    const result = allErpOrders.map((erpOrder) => {
      const sync = db.findSyncRecordByErpId(erpOrder.erpOrderId);
      return {
        erpOrderId: erpOrder.erpOrderId,
        customer: erpOrder.deliveryAddress.name,
        status: sync ? sync.state : "PENDING_PULL",
        mabangId: sync?.mabangOrderId || "-",
        lastError: sync?.lastError,
        retryCount: sync?.retryCount || 0,
      };
    });
    return c.json(result);
  }
);

api.openapi(
  createRoute({
    method: "post",
    tags: ["ERP Order"],
    path: "/api/inject-order",
    request: {
      body: {
        content: {
          "application/json": {
            schema: InjectOrderSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Inject a mock order",
        content: {
          "application/json": {
            schema: SuccessSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const input = c.req.valid("json");
    const { scenario, ...order } = input;

    // Apply scenario to ID if needed
    if (scenario === "FAIL_RANDOM") {
      order.erpOrderId = `FAIL_RANDOM-${order.erpOrderId}`;
    } else if (scenario === "FAIL_HARD") {
      order.erpOrderId = `FAIL_HARD-${order.erpOrderId}`;
    }

    await fulfilService.injectMockOrder(order);

    if (scenario === "DUPLICATE") {
      // Inject again
      await fulfilService.injectMockOrder(order);
    }

    return c.json({
      success: true,
      message: `Injected order ${order.erpOrderId} (Scenario: ${
        scenario || "NORMAL"
      })`,
    });
  }
);

api.openapi(
  createRoute({
    method: "get",
    tags: ["Internal"],
    path: "/api/orders/failed",
    responses: {
      200: {
        description: "List failed/DLQ orders",
        content: {
          "application/json": {
            schema: FailedOrderListSchema,
          },
        },
      },
    },
  }),
  (c) => {
    const failed = db
      .getAllSyncRecords()
      .filter((r) => r.state === "DEAD_LETTER")
      .map((r) => ({
        ecomflowOrderId: r.ecomflowOrderId,
        erpOrderId: r.erpOrderId,
        lastError: r.lastError || "Unknown",
        retryCount: r.retryCount,
        createdAt: r.createdAt.toISOString(),
      }));
    return c.json(failed);
  }
);

api.openapi(
  createRoute({
    method: "post",
    tags: ["Internal"],
    path: "/api/orders/:id/replay",
    responses: {
      200: {
        description: "Replay a failed order",
        content: {
          "application/json": {
            schema: SuccessSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    const success = await orchestrator.replayOrder(id);
    if (success) {
      return c.json({ success: true, message: "Order queued for replay" });
    } else {
      return c.json({
        success: false,
        message: "Order not found or not in DLQ",
      });
    }
  }
);

api.openapi(
  createRoute({
    method: "get",
    tags: ["ERP Order"],
    path: "/api/debug/erp",
    responses: {
      200: {
        description: "Get raw ERP orders",
        content: {
          "application/json": {
            schema: z.array(z.any()),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json(Array.from(db.erpOrders.values()));
  }
);

api.openapi(
  createRoute({
    method: "get",
    tags: ["WMS Order"],
    path: "/api/debug/wms",
    responses: {
      200: {
        description: "Get raw WMS orders",
        content: {
          "application/json": {
            schema: z.array(z.any()),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json(Array.from(db.mabangOrders.values()));
  }
);

api.openapi(
  createRoute({
    method: "post",
    tags: ["Internal"],
    path: "/api/trigger-sync",
    responses: {
      200: {
        description: "Trigger sync process",
        content: {
          "application/json": {
            schema: SuccessSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { queueService } = await import("../services/queue.js");
    await queueService.addJob("FETCH_ORDERS");
    return c.json({ success: true, message: "Sync job enqueued" });
  }
);

api.openapi(
  createRoute({
    method: "get",
    tags: ["Internal"],
    path: "/api/health",
    responses: {
      200: {
        description: "Get health/reconciliation stats",
        content: {
          "application/json": {
            schema: ReconciliationSummarySchema,
          },
        },
      },
    },
  }),
  (c) => {
    const summary = reconciliationService.getSummary();
    return c.json(summary);
  }
);

api.openapi(
  createRoute({
    method: "post",
    tags: ["Internal"],
    path: "/api/reconcile",
    responses: {
      200: {
        description: "Run reconciliation",
        content: {
          "application/json": {
            schema: ReconciliationSummarySchema,
          },
        },
      },
    },
  }),
  (c) => {
    const summary = reconciliationService.getSummary();
    return c.json(summary);
  }
);

api.openapi(
  createRoute({
    method: "get",
    tags: ["Internal"],
    path: "/api/health/system",
    responses: {
      200: {
        description: "Get system health status",
        content: {
          "application/json": {
            schema: SystemHealthSchema,
          },
        },
      },
    },
  }),
  (c) => {
    const summary = reconciliationService.getSummary();
    const HEALTH_THRESHOLD = 5; // Max allowed mismatches before RED
    const isHealthy = summary.mismatches <= HEALTH_THRESHOLD;

    return c.json({
      erp: "UP" as const,
      wms: "UP" as const,
      isHealthy,
      queue: {
        status: "UP" as const,
        length: queueService.getQueueLength(),
      },
      jobs: {
        sync: schedulerService.isSyncEnabled,
        reconcile: schedulerService.isReconcileEnabled,
      },
    });
  }
);

api.openapi(
  createRoute({
    method: "post",
    tags: ["Internal"],
    path: "/api/jobs/sync/toggle",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ToggleJobSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Toggle sync job",
        content: {
          "application/json": {
            schema: SuccessSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { enabled } = c.req.valid("json");
    if (enabled) {
      schedulerService.startSync();
    } else {
      schedulerService.stopSync();
    }
    return c.json({
      success: true,
      message: `Sync job ${enabled ? "started" : "stopped"}`,
    });
  }
);

api.openapi(
  createRoute({
    method: "post",
    tags: ["Internal"],
    path: "/api/jobs/reconcile/toggle",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ToggleJobSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Toggle reconcile job",
        content: {
          "application/json": {
            schema: SuccessSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { enabled } = c.req.valid("json");
    if (enabled) {
      schedulerService.startReconcile();
    } else {
      schedulerService.stopReconcile();
    }
    return c.json({
      success: true,
      message: `Reconcile job ${enabled ? "started" : "stopped"}`,
    });
  }
);

api.openapi(
  createRoute({
    method: "get",
    tags: ["Internal"],
    path: "/api/reconcile/detailed",
    responses: {
      200: {
        description: "Get detailed reconciliation report",
        content: {
          "application/json": {
            schema: DetailedReconciliationSchema,
          },
        },
      },
    },
  }),
  (c) => {
    return c.json(reconciliationService.getDetailedReconciliation());
  }
);

export { api };
