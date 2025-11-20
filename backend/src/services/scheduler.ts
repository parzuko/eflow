import { queueService } from "./queue.js";
import { reconciliationService } from "./reconciliation.js";

class SchedulerService {
  private syncInterval: NodeJS.Timeout | null = null;
  private reconcileInterval: NodeJS.Timeout | null = null;

  public isSyncEnabled = false;
  public isReconcileEnabled = false;

  startSync(intervalMs: number = 10000) {
    if (this.syncInterval) return;
    this.isSyncEnabled = true;
    console.log("[Scheduler] Starting background sync...");
    // Run immediately
    queueService.addJob("FETCH_ORDERS");
    this.syncInterval = setInterval(() => {
      queueService.addJob("FETCH_ORDERS");
    }, intervalMs);
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isSyncEnabled = false;
    console.log("[Scheduler] Stopped background sync.");
  }

  startReconcile(intervalMs: number = 15000) {
    if (this.reconcileInterval) return;
    this.isReconcileEnabled = true;
    console.log("[Scheduler] Starting background reconciliation...");

    this.reconcileInterval = setInterval(() => {
      console.log("[Scheduler] Running background reconciliation check...");
      const summary = reconciliationService.getSummary();
      if (summary.mismatches > 0) {
        console.warn(
          `[Scheduler] Reconciliation Alert: ${summary.mismatches} mismatches found.`
        );
      }
    }, intervalMs);
  }

  stopReconcile() {
    if (this.reconcileInterval) {
      clearInterval(this.reconcileInterval);
      this.reconcileInterval = null;
    }
    this.isReconcileEnabled = false;
    console.log("[Scheduler] Stopped background reconciliation.");
  }
}

export const schedulerService = new SchedulerService();
