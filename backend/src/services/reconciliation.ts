import { db } from "../store.js";
import type { ReconciliationSummary } from "../types.js";

interface Mismatch {
  erpOrderId: string;
  issue: string;
  details?: string;
}

export class ReconciliationService {
  getSummary(): ReconciliationSummary {
    const erpIds = new Set(db.erpOrders.keys());
    const wmsRefs = new Set(
      Array.from(db.mabangOrders.values()).map((o) => o.shopId)
    ); // shopId maps to erpOrderId

    let inSync = 0;
    let onlyInErp = 0;
    let onlyInWms = 0;
    let statusMismatch = 0;
    let failed = 0;

    // Check ERP vs WMS
    for (const erpId of erpIds) {
      const record = db.findSyncRecordByErpId(erpId);

      if (wmsRefs.has(erpId)) {
        // Exists in both
        if (record && record.state === "ACKNOWLEDGED_BY_WMS") {
          inSync++;
        } else {
          statusMismatch++;
        }
      } else {
        // Exists only in ERP (or failed to sync)
        if (
          record &&
          (record.state === "FAILED" || record.state === "DEAD_LETTER")
        ) {
          failed++;
        } else {
          onlyInErp++;
        }
      }
    }

    // Check WMS vs ERP (orphans)
    for (const wmsRef of wmsRefs) {
      if (!erpIds.has(wmsRef)) {
        onlyInWms++;
      }
    }

    return {
      inSync,
      onlyInErp,
      onlyInWms,
      statusMismatch,
      failed,
      mismatches: failed + statusMismatch + onlyInWms,
    };
  }
  getDetailedReconciliation() {
    const mismatches: Mismatch[] = [];
    const erpOrders = db.erpOrders;
    const wmsOrders = db.mabangOrders;

    // Check ERP orders
    for (const [id, _] of erpOrders) {
      const record = db.findSyncRecordByErpId(id);
      const wmsOrder = Array.from(wmsOrders.values()).find(
        (o) => o.shopId === id
      );

      if (!wmsOrder) {
        mismatches.push({
          erpOrderId: id,
          issue: "Missing in WMS",
          details: record ? `State: ${record.state}` : "No sync record found",
        });
      } else if (record && record.state === "FAILED") {
        mismatches.push({
          erpOrderId: id,
          issue: "Sync Failed",
          details: record.lastError,
        });
      }
    }

    // Check WMS orders (orphans)
    for (const [_, wmsOrder] of wmsOrders) {
      const erpOrder = erpOrders.get(wmsOrder.shopId);
      if (!erpOrder) {
        mismatches.push({
          erpOrderId: wmsOrder.shopId,
          issue: "Orphan in WMS",
          details: "Exists in WMS but not in ERP source",
        });
      }
    }

    return mismatches;
  }
}

export const reconciliationService = new ReconciliationService();
