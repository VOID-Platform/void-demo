#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export PATH="$HOME/.local/bin:$PATH"

echo "===================================================="
echo "⚙️ Setting up SigNoz Self-Hosted Deployment..."
echo "===================================================="

if ! command -v foundryctl &> /dev/null; then
  echo "📥 Installing SigNoz Foundry CLI (foundryctl)..."
  mkdir -p "$HOME/.local/bin"
  curl -fsSL https://signoz.io/foundry.sh | FOUNDRY_INSTALL_DIR="$HOME/.local/bin" FOUNDRY_ASSUME_YES="true" bash
fi

echo "✅ foundryctl version: $(foundryctl version 2>/dev/null || echo 'installed')"

cd "$DEMO_DIR"

echo "🚀 Deploying SigNoz via foundryctl cast..."
foundryctl cast -f casting.yaml

echo "===================================================="
echo "✅ SigNoz services started successfully!"
echo "===================================================="
