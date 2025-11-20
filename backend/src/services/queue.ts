import { v4 as uuid } from "uuid";
import { orchestrator } from "./orchestrator.js";

type JobType = "SYNC_ORDER" | "FETCH_ORDERS";

interface Job {
  id: string;
  type: JobType;
  payload: any;
  retryCount: number;
}

export class QueueService {
  private queue: Job[] = [];
  private isProcessing = false;

  async addJob(type: JobType, payload: any = {}) {
    const job: Job = {
      id: uuid(),
      type,
      payload,
      retryCount: 0,
    };
    this.queue.push(job);
    console.log(`[Queue] Added job ${job.id} (${type})`);
    this.processNext();
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const job = this.queue.shift();

    if (job) {
      try {
        console.log(`[Queue] Processing job ${job.id} (${job.type})...`);
        if (job.type === "SYNC_ORDER") {
          // Payload is ErpOrderInput
          await orchestrator.processOrder(job.payload);
        } else if (job.type === "FETCH_ORDERS") {
          await orchestrator.fetchAndEnqueueOrders();
        }
      } catch (error) {
        console.error(`[Queue] Job ${job.id} failed: `, error); // DLQ
      } finally {
        this.isProcessing = false;
        this.processNext();
      }
    } else {
      this.isProcessing = false;
    }
  }

  getQueueLength() {
    return this.queue.length;
  }
}

export const queueService = new QueueService();
