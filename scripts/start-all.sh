#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export PATH="$HOME/.local/bin:$PATH"

cd "$DEMO_DIR"

echo "===================================================="
echo "🚀 [VOID DEMO UNIFIED LAUNCHER]"
echo "Starting Self-Hosted SigNoz & Demo Telemetry"
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
  sleep 3
done

if [ "$HEALTHY" = true ]; then
  echo "✅ SigNoz OTLP Collector is live and ready at http://localhost:4318/v1/traces!"
else
  echo "⚠️ SigNoz Collector did not respond in time, proceeding to attempt demo execution anyway..."
fi

echo ""
echo "----------------------------------------------------"
echo "🌐 SigNoz Web Dashboard: http://localhost:3301 (or http://localhost:8080)"
echo "----------------------------------------------------"
echo ""

# 3. Execute the AI Agent Telemetry Demo
echo "🤖 Executing AI Agent Telemetry Demo..."
echo "----------------------------------------------------"
npx tsx src/demo.ts

echo ""
echo "===================================================="
echo "🎉 ALL SYSTEMS GO!"
echo "SigNoz is running in self-hosted mode and telemetry traces were sent."
echo "View your traces in the SigNoz Dashboard: http://localhost:3301"
echo "To stop SigNoz containers later, run: npm run signoz:down"
echo "===================================================="
