import { db } from "../store.js";
import type { ErpOrderInput } from "../types.js";

export class ErpService {
  // Simulate fetching new orders from Fulfil
  // Here we just return all orders in our mock ERP store that haven't been synced yet
  async fetchNewOrders(): Promise<ErpOrderInput[]> {
    const allErpOrders = Array.from(db.erpOrders.values());
    const newOrders: ErpOrderInput[] = [];

    for (const order of allErpOrders) {
      const existingSync = db.findSyncRecordByErpId(order.erpOrderId);
      if (!existingSync) {
        newOrders.push(order);
      }
    }

    return newOrders;
  }

  async injectMockOrder(order: ErpOrderInput) {
    db.addErpOrder(order);
    console.log(`[ERP] Injected order ${order.erpOrderId}`);
  }
}

export const fulfilService = new ErpService();
