# Ecomflow Integration Simulation

A robust simulation of an order integration middleware between **Fulfil (ERP)** and **Mabang (WMS)**.

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation + Running Locally

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/parzuko/eflow
    cd eflow
    ```

2.  **Install dependencies**:

    ```bash
    pnpm install
    ```

3.  **Run**:

    ```bash
    pnpm run dev
    # Server started at port 9000
    # Docs at 9000/docs
    # FE at 3000

    ```

## 🚀 Features

- **Full Order Lifecycle**: Simulates pulling orders from ERP, transforming them, and pushing to WMS.
- **Resilience**:
  - **Retries**: Automatically retries transient network failures.
  - **Dead Letter Queue (DLQ)**: Captures permanently failed orders for manual replay.
  - **Idempotency**: Prevents duplicate orders in the WMS.
- **Observability**:
  - **Real-time Dashboard**: View active orders, system health, and sync status.
  - **Reconciliation**: Detailed reports on discrepancies between ERP and WMS.
  - **Health Checks**: Monitoring endpoints for system components.
- **Stack**: Built with Hono (Backend) and Next.js 15 (Frontend).

## 🛠 Tech Stack

### Backend (`backend/`)

- **Runtime**: Node.js
- **Framework**: [Hono](https://hono.dev)
- **Language**: TypeScript
- **Validation**: Zod
- **Docs**: OpenAPI / Swagger UI

### Frontend (`frontend/`)

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Styling**: Tailwind CSS
- **State/Network**: TanStack Query (React Query)

## 🎮 How to Use

1.  Open the **Dashboard** at `http://localhost:3000`.
2.  **Inject Order**: Click "Inject Order" to create a mock order in the ERP.
    - Try different scenarios: `FAIL_RANDOM` (50% fail chance) or `FAIL_HARD` (100% fail).
3.  **Trigger Sync**: Click "Trigger Sync" to process pending orders.
    - Watch the status change from `PENDING_SYNC` to `ACKNOWLEDGED_BY_WMS` (or `FAILED`).
4.  **Handle Failures**:
    - Go to the **Failures / DLQ** tab to see failed orders.
    - Click **Replay** to retry them.
5.  **Reconcile**: Click "Reconcile" or go to the **Detailed Reconciliation** tab to verify system integrity.

## 📂 Project Structure

```
.
├── backend/
│   ├── package.json           # Backend-specific deps/scripts
│   ├── src/
│   │   ├── index.ts           # Hono bootstrap + route mounting
│   │   ├── routes/api.ts      # REST API definitions
│   │   ├── services/          # ERP, WMS, orchestrator, queue, recon
│   │   ├── schemas.ts         # Zod validation schemas
│   │   ├── store.ts           # In-memory persistence
│   │   └── types.ts           # Shared backend types
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx         # Root layout + providers
│   │   ├── page.tsx           # Dashboard entry
│   │   ├── globals.css        # Tailwind base styles
│   │   ├── lib/               # API client + shared types
│   │   ├── queries/           # TanStack Query hooks (stats, orders…)
│   │   └── mutations/         # Actions (sync, replay, toggle jobs…)
│   ├── next.config.ts
│   └── tsconfig.json
├── pnpm-workspace.yaml        # Workspace definition
├── package.json               # Root scripts (e.g. dev spins BE+FE)
└── README.md
```
