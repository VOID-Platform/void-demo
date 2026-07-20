#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "===================================================="
echo "🛑 Stopping SigNoz Self-Hosted Deployment..."
echo "===================================================="

cd "$DEMO_DIR"

if [ -f "$DEMO_DIR/pours/deployment/compose.yaml" ]; then
  docker compose -f "$DEMO_DIR/pours/deployment/compose.yaml" down
elif command -v foundryctl &> /dev/null; then
  foundryctl uncast -f casting.yaml || true
else
  echo "No active compose configuration found."
fi

echo "===================================================="
echo "✅ SigNoz services stopped."
echo "===================================================="
