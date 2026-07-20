# SigNoz Self-Hosted Demo (`void-demo`)

This repository demonstrates how to self-host **SigNoz** and emit OpenTelemetry-native traces using `@void-hq/sdk`.

---

## ⚡ Quickstart (One Command)

Everything (SigNoz self-hosted infrastructure, health readiness check, and the AI Agent telemetry demo script) can be started with a **single command**:

```bash
npm start
```

### What `npm start` does:
1. Provisions/starts self-hosted SigNoz containers via `foundryctl` (SigNoz Foundry).
2. Waits for the OTLP Collector endpoint (`http://localhost:4318/v1/traces`) to become healthy.
3. Executes `src/demo.ts` using `@void-hq/sdk` to simulate AI Agent loops, tool calls, and LLM reasoning steps emitting live telemetry.

---

## 📊 Accessing SigNoz UI

Once running, open your web browser to view your traces:

- **SigNoz Dashboard**: [http://localhost:3301](http://localhost:3301) (or `http://localhost:8080`)
- **OTLP Traces Endpoint**: `http://localhost:4318/v1/traces`

---

## 🛠️ Individual Commands

- **Start SigNoz & Run Demo**: `npm start`
- **Start SigNoz Only**: `npm run signoz:up`
- **Run Telemetry Demo Only**: `npm run demo`
- **Stop SigNoz Containers**: `npm run signoz:down`

---

## 📁 Repository Structure

```
void-demo/
├── casting.yaml             # SigNoz Foundry deployment manifest
├── package.json             # Demo configuration & scripts
├── tsconfig.json            # TypeScript configuration
├── scripts/
│   ├── setup-signoz.sh      # Installs foundryctl and casts SigNoz containers
│   ├── stop-signoz.sh       # Stops SigNoz containers
│   └── start-all.sh         # Unified single-command launcher
└── src/
    └── demo.ts              # Agent telemetry demo using @void-hq/sdk
```
