import { db } from "../store.js";
import type { MabangOrderRecord } from "../types.js";

export class WmsService {
  async createOrder(
    order: MabangOrderRecord
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // SCENARIO: Force Random Failure | 50% chance of failure
    if (order.shopId.includes("FAIL_RANDOM") && Math.random() < 0.5) {
      console.error(`[WMS] Simulated random failure for order ${order.shopId}`);
      return { success: false, error: "Simulated Random Network Error" };
    }

    // SCENARIO: Force Hard Failure | Always fail
    if (order.shopId.includes("FAIL_HARD")) {
      console.error(`[WMS] Simulated hard failure for order ${order.shopId}`);
      return { success: false, error: "Simulated Hard Error (Maintenance)" };
    }

    // Simulate random failure | (low chance for normal orders)
    if (Math.random() < 0.05) {
      console.error(`[WMS] Random failure for order ${order.shopId}`);
      return { success: false, error: "Random network error" };
    }

    // Idempotency check (simulated WMS behavior) | If order with same shopId (used as ref) exists, return success
    const existing = Array.from(db.mabangOrders.values()).find(
      (o) => o.shopId === order.shopId
    );
    if (existing) {
      console.log(
        `[WMS] Order ${order.shopId} already exists. Idempotent success.`
      );
      return { success: true, id: existing.id };
    }

    // Save to mock WMS
    db.addMabangOrder(order);
    console.log(`[WMS] Created order ${order.id} (Ref: ${order.shopId})`);

    return { success: true, id: order.id };
  }
}

export const mabangService = new WmsService();
