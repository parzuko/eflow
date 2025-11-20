"use client";

import { useState } from "react";

import { RefreshCw, AlertTriangle, Activity, Layers, Bug } from "lucide-react";
import { useStats } from "./queries/useStats";
import { useHealth } from "./queries/useHealth";
import { useOrders } from "./queries/useOrders";
import { useDLQ } from "./queries/useDLQ";
import { useReconcile } from "./queries/useReconcile";
import { useErpInjection } from "./mutations/useErpInjection";
import { ScenarioType } from "./lib/types";
import { useSync } from "./mutations/useSync";
import { useReconcileExplicit } from "./mutations/useReconcileExplicit";
import { useToggleJob } from "./mutations/useToggleJob";
import { useReplay } from "./mutations/useReplay";
import { useDebug } from "./queries/useDebug";

export default function Home() {
  const [tab, setTab] = useState<"orders" | "dlq" | "reconcile" | "debug">(
    "orders"
  );
  const [scenario, setScenario] = useState<ScenarioType>("NORMAL");

  const statsQuery = useStats();
  const healthQuery = useHealth();
  const ordersQuery = useOrders();
  const dlqQuery = useDLQ();
  const reconcileQuery = useReconcile(tab === "reconcile");
  const debugQuery = useDebug();

  const injectMutation = useErpInjection();
  const syncMutation = useSync();
  const reconcileMutation = useReconcileExplicit();
  const toggleJobMutation = useToggleJob();
  const replayMutation = useReplay(() =>
    setTimeout(() => setTab("orders"), 500)
  );

  const stats = statsQuery.data || {
    inSync: 0,
    onlyInErp: 0,
    onlyInWms: 0,
    statusMismatch: 0,
    failed: 0,
    mismatches: 0,
  };
  const health = healthQuery.data || {
    erp: "UNKNOWN",
    wms: "UNKNOWN",
    queue: { status: "UNKNOWN", length: 0 },
    jobs: { sync: false, reconcile: false },
  };
  const orders = ordersQuery.data || [];
  const dlqOrders = dlqQuery.data || [];
  const reconciliation = reconcileQuery.data || [];

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ecomflow Take Home
            </h1>
            <p className="text-gray-500">See order journey from ERP to WMS</p>
          </div>
          <div className="flex space-x-2">
            <div className="flex rounded-md shadow-sm">
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as ScenarioType)}
                className="rounded-l-md border-gray-300 border px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="NORMAL">Normal Order</option>
                <option value="FAIL_RANDOM">Random Failure (50%)</option>
                <option value="FAIL_HARD">Hard Failure (Maintenance)</option>
                <option value="DUPLICATE">Duplicate Order</option>
              </select>
              <button
                onClick={() => injectMutation.mutate(scenario)}
                disabled={injectMutation.isPending}
                className="bg-black text-white px-4 py-2 rounded-r-md hover:bg-gray-800 cursor-pointer text-sm font-medium disabled:opacity-50 ml-1"
              >
                {injectMutation.isPending ? "Injecting..." : "Inject Order"}
              </button>
            </div>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 cursor-pointer text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw
                size={16}
                className={syncMutation.isPending ? "animate-spin" : ""}
              />
              Trigger Sync
            </button>
            <button
              onClick={() => reconcileMutation.mutate()}
              disabled={reconcileMutation.isPending}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 cursor-pointer text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <Activity size={16} />
              Reconcile
            </button>
          </div>
        </header>

        {/* Stats & Health */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Simple Counters */}
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Received from ERP</div>
            <div className="text-2xl font-bold">
              {stats.onlyInErp +
                stats.inSync +
                stats.statusMismatch +
                stats.failed}
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Synced (WMS)</div>
            <div className="text-2xl font-bold">{stats.inSync}</div>
          </div>
          <div className="bg-white p-4 rounded shadow border-b-4 border-red-500">
            <div className="text-sm text-gray-500">Failed / Mismatch</div>
            <div className="text-2xl font-bold">
              {stats.failed + stats.statusMismatch + stats.onlyInWms}
            </div>
          </div>

          {/* System Health & Toggles */}
          <div
            className={`bg-white p-4 rounded shadow border-b-4 ${
              stats.mismatches > 5
                ? "border-red-600 bg-red-50"
                : "border-green-500"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div
                  className={`text-sm font-bold ${
                    stats.mismatches > 5 ? "text-red-800" : "text-gray-500"
                  }`}
                >
                  System Health
                </div>
                <div className="text-xs mt-1 space-y-1">
                  <div>
                    Status:{" "}
                    <span className="font-bold">
                      {stats.mismatches > 5 ? "DEGRADED" : "HEALTHY"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between space-x-2">
                  <span>Auto-Sync</span>
                  <button
                    onClick={() =>
                      toggleJobMutation.mutate({
                        job: "sync",
                        enabled: !health.jobs?.sync,
                      })
                    }
                    className={`w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none ${
                      health.jobs?.sync ? "bg-black" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                        health.jobs?.sync ? "translate-x-4" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <span>Auto-Rec</span>
                  <button
                    onClick={() =>
                      toggleJobMutation.mutate({
                        job: "reconcile",
                        enabled: !health.jobs?.reconcile,
                      })
                    }
                    className={`w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none ${
                      health.jobs?.reconcile ? "bg-black" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                        health.jobs?.reconcile
                          ? "translate-x-4"
                          : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setTab("orders")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                tab === "orders"
                  ? "border-gray-500 text-gray-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Layers size={16} />
              Active Orders
            </button>
            <button
              onClick={() => setTab("dlq")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                tab === "dlq"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <AlertTriangle size={16} />
              Failures / DLQ
              {dlqOrders.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {dlqOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("reconcile")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                tab === "reconcile"
                  ? "border-gray-500 text-gray-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Activity size={16} />
              Detailed Reconciliation
            </button>
            <button
              onClick={() => setTab("debug")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                tab === "debug"
                  ? "border-gray-500 text-gray-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Bug size={16} />
              Source of Truth (Debug)
            </button>
          </nav>
        </div>

        {/* Active Orders Table */}
        {tab === "orders" && (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ERP Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sync Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WMS ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {orders.map((order: any) => (
                  <tr key={order.erpOrderId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.erpOrderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          order.status === "ACKNOWLEDGED_BY_WMS"
                            ? "bg-green-100 text-green-800"
                            : order.status === "SENT_TO_WMS"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : order.status === "PENDING_SYNC"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "DEAD_LETTER"
                            ? "bg-gray-800 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.mabangId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.retryCount}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-red-500 truncate max-w-xs"
                      title={order.lastError}
                    >
                      {order.lastError || "-"}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No active orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* DLQ Table */}
        {tab === "dlq" && (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-100 text-red-800 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              Orders here have exhausted their retry attempts. Review the error
              and click Replay to try again.
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ERP Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fatal Error
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {dlqOrders.map((order: any) => (
                  <tr key={order.ecomflowOrderId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.erpOrderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.retryCount}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium"
                      title={order.lastError}
                    >
                      {order.lastError}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          replayMutation.mutate(order.ecomflowOrderId)
                        }
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 ml-auto"
                      >
                        <RefreshCw size={14} /> Replay
                      </button>
                    </td>
                  </tr>
                ))}
                {dlqOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No failed orders in DLQ.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed Reconciliation Table */}
        {tab === "reconcile" && (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 text-gray-800 text-sm flex items-center gap-2">
              <Activity size={16} />
              Detailed list of discrepancies between ERP and WMS.
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ERP Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {reconciliation.map((item: any) => (
                  <tr key={item.erpOrderId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.erpOrderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {item.issue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.details}
                    </td>
                  </tr>
                ))}
                {reconciliation.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No discrepancies found. All systems in sync.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Debug View */}
        {tab === "debug" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded shadow p-4">
              <h3 className="font-bold text-gray-700 mb-2">
                Raw ERP Orders (Source)
              </h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto h-96">
                {JSON.stringify(debugQuery.data?.erp, null, 2)}
              </pre>
            </div>
            <div className="bg-white rounded shadow p-4">
              <h3 className="font-bold text-gray-700 mb-2">
                Raw WMS Orders (Destination)
              </h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto h-96">
                {JSON.stringify(debugQuery.data?.wms, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
