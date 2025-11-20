import axios from "axios";
import { InjectOrderType } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000/api";

export const api = axios.create({
  baseURL: API_URL,
});

export const fetchOrders = async () => {
  const { data } = await api.get("/orders");
  return data;
};

export const fetchStats = async () => {
  const { data } = await api.get("/health");
  return data;
};

export const fetchSystemHealth = async () => {
  const { data } = await api.get("/health/system");
  return data;
};

export const fetchFailedOrders = async () => {
  const { data } = await api.get("/orders/failed");
  return data;
};

export const fetchReconciliation = async () => {
  const { data } = await api.get("/reconcile/detailed");
  return data;
};

export const injectOrder = async (order: InjectOrderType) => {
  const { data } = await api.post("/inject-order", order);
  return data;
};

export const triggerSync = async () => {
  const { data } = await api.post("/trigger-sync");
  return data;
};

export const reconcile = async () => {
  const { data } = await api.post("/reconcile");
  return data;
};

export const replayOrder = async (id: string) => {
  const { data } = await api.post(`/orders/${id}/replay`);
  return data;
};

export const toggleJob = async (job: string, enabled: boolean) => {
  const { data } = await api.post(`/jobs/${job}/toggle`, { enabled });
  return data;
};

export const debugErp = async () => {
  const { data } = await api.get("/debug/erp");
  return data;
};

export const debugWms = async () => {
  const { data } = await api.get("/debug/wms");
  return data;
};
