import type {
  ErpOrderInput,
  MabangOrderRecord,
  OrderSyncRecord,
} from "./types.js";

class Store {
  // internal state
  public syncRecords: Map<string, OrderSyncRecord> = new Map(); // normalized orders
  public erpOrders: Map<string, ErpOrderInput> = new Map();
  public mabangOrders: Map<string, MabangOrderRecord> = new Map();

  addErpOrder(order: ErpOrderInput) {
    this.erpOrders.set(order.erpOrderId, order);
  }

  getErpOrder(erpOrderId: string) {
    return this.erpOrders.get(erpOrderId);
  }

  addMabangOrder(order: MabangOrderRecord) {
    this.mabangOrders.set(order.id, order);
  }

  getMabangOrder(id: string) {
    return this.mabangOrders.get(id);
  }

  upsertSyncRecord(record: OrderSyncRecord) {
    this.syncRecords.set(record.ecomflowOrderId, record);
  }

  findSyncRecordByErpId(erpOrderId: string) {
    for (const record of this.syncRecords.values()) {
      if (record.erpOrderId === erpOrderId) {
        return record;
      }
    }
    return undefined;
  }

  getAllSyncRecords() {
    return Array.from(this.syncRecords.values());
  }
}

export const db = new Store();
