#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export PATH="$HOME/.local/bin:$PATH"

cd "$DEMO_DIR"

echo "===================================================="
echo "🚀 [VOID DEMO UNIFIED LAUNCHER]"
echo "Starting Self-Hosted SigNoz & Web Application"
echo "===================================================="

# 1. Start SigNoz infrastructure
bash "$SCRIPT_DIR/setup-signoz.sh"

# 2. Wait for SigNoz OTLP Collector to be ready
echo ""
echo "⏳ Waiting for SigNoz OTLP Collector (http://localhost:4318) to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s -X POST http://localhost:4318/v1/traces -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "   Waiting for OTLP collector endpoint... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ "$HEALTHY" = true ]; then
  echo "✅ SigNoz OTLP Collector is live and ready at http://localhost:4318/v1/traces!"
else
  echo "⚠️ SigNoz Collector did not respond in time, proceeding to launch Next.js application anyway..."
fi

echo ""
echo "----------------------------------------------------"
echo "🌐 SigNoz Web Dashboard: http://localhost:8080 (or http://localhost:3301)"
echo "💻 VOID Demo Web App:   http://localhost:3000"
echo "----------------------------------------------------"
echo ""

# 3. Seed initial OpenTelemetry traces
echo "🤖 Seeding initial AI agent telemetry traces to SigNoz..."
if ! npx tsx scripts/verify-demo.ts; then
  echo "⚠️ WARNING: Initial telemetry seeding/verification encountered issues. Launching web app in best-effort mode..."
fi

echo ""
echo "===================================================="
echo "🎉 ALL SYSTEMS GO! Launching Next.js Web App on http://localhost:3000..."
echo "===================================================="
echo ""

# 4. Launch Next.js Dev Server on Port 3000
npm run dev
