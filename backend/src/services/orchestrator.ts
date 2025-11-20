import { v4 as uuid } from "uuid";
import { fulfilService } from "./erp.js";
import { db } from "../store.js";
import type {
  ErpOrderInput,
  MabangOrderRecord,
  OrderSyncRecord,
} from "../types.js";
import { mabangService } from "./wms.js";

export class Orchestrator {
  async fetchAndEnqueueOrders() {
    console.log("[Orchestrator] Starting fetch job...");

    // 1. Fetch new orders from Fulfil
    const newOrders = await fulfilService.fetchNewOrders();
    console.log(`[Orchestrator] Found ${newOrders.length} new orders.`);

    // // Push to Queue
    const { queueService } = await import("./queue.js");
    for (const order of newOrders) {
      await queueService.addJob("SYNC_ORDER", order);
    }

    // 2. Retry failed/pending orders
    const pendingOrders = db
      .getAllSyncRecords()
      .filter(
        (r) =>
          (r.state === "PENDING_SYNC" || r.state === "FAILED") &&
          r.retryCount < 3
      );

    console.log(
      `[Orchestrator] Retrying ${pendingOrders.length} pending/failed orders.`
    );
    for (const record of pendingOrders) {
      if (record.erpPayload) {
        await queueService.addJob("SYNC_ORDER", record.erpPayload);
      }
    }
  }

  async processOrder(
    erpOrder: ErpOrderInput,
    existingRecord?: OrderSyncRecord
  ) {
    let record = existingRecord;

    // (idempotency check)
    if (!record) {
      record = db.findSyncRecordByErpId(erpOrder.erpOrderId);
    }

    if (!record) {
      record = {
        ecomflowOrderId: uuid(),
        erpOrderId: erpOrder.erpOrderId,
        state: "PENDING_SYNC",
        createdAt: new Date(),
        updatedAt: new Date(),
        erpPayload: erpOrder,
        retryCount: 0,
      };
      db.upsertSyncRecord(record);
    }

    // If already synced or DLQ, skip
    if (
      record.state === "ACKNOWLEDGED_BY_WMS" ||
      record.state === "DEAD_LETTER"
    ) {
      return;
    }

    try {
      // Transform
      const mabangOrder = this.transformToMabang(erpOrder);

      // Push to Mabang
      const result = await mabangService.createOrder(mabangOrder);

      if (result.success) {
        record.state = "ACKNOWLEDGED_BY_WMS";
        record.mabangOrderId = result.id;
        record.lastError = undefined;
      } else {
        record.retryCount++;
        if (record.retryCount >= 3) {
          record.state = "DEAD_LETTER";
          record.lastError = `Max retries reached. Last error: ${result.error}`;
        } else {
          record.state = "FAILED";
          record.lastError = result.error;
        }
      }
    } catch (error) {
      record.retryCount++;
      if (record.retryCount >= 3) {
        record.state = "DEAD_LETTER";
        record.lastError = `Max retries reached. Last error: ${
          error instanceof Error ? error.message : String(error)
        }`;
      } else {
        record.state = "FAILED";
        record.lastError =
          error instanceof Error ? error.message : String(error);
      }
    }

    record.updatedAt = new Date();
    db.upsertSyncRecord(record);
  }

  async replayOrder(ecomflowOrderId: string) {
    const record = db.syncRecords.get(ecomflowOrderId);
    if (record && record.state === "DEAD_LETTER") {
      console.log(`[Orchestrator] Replaying DLQ order ${ecomflowOrderId}`);
      record.state = "PENDING_SYNC";
      record.retryCount = 0;
      record.lastError = undefined;
      db.upsertSyncRecord(record);

      // Re-queue
      const { queueService } = await import("./queue.js");
      await queueService.addJob("SYNC_ORDER", record.erpPayload);
      return true;
    }
    return false;
  }

  transformToMabang(erpOrder: ErpOrderInput): MabangOrderRecord {
    // Simple transformation logic
    return {
      id: uuid(),
      platformOrderId: erpOrder.erpOrderId,
      shopId: erpOrder.erpOrderId, // Using erpOrderId as unique ref
      createDate: new Date(),
      orderStatus: "PAID", // Default
      countryCode: erpOrder.deliveryAddress.countryCode,
      issueStatus: "NO_ISSUE",
      isManualHold: false,
    };
  }
}

export const orchestrator = new Orchestrator();
