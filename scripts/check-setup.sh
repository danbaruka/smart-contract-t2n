#!/bin/bash

# Check deployment prerequisites

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 Task2Earn - Deployment Prerequisites Check"
echo "=============================================="
echo ""

# Check 1: TARGET_DIR
if [ -z "$TARGET_DIR" ]; then
    echo -e "${YELLOW}⚠️  TARGET_DIR not set${NC}"
    echo "   Set it with: export TARGET_DIR=\"\$HOME/cardano-testnet\""
    TARGET_DIR="$HOME/cardano-testnet"
    echo "   Using default: $TARGET_DIR"
else
    echo -e "${GREEN}✅ TARGET_DIR is set: $TARGET_DIR${NC}"
fi
echo ""

# Check 2: Wallet files
WALLET_DIR="$TARGET_DIR/wallet"
echo "📁 Checking wallet files in $WALLET_DIR..."

if [ ! -f "$WALLET_DIR/payment.addr" ]; then
    echo -e "${RED}❌ payment.addr not found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ payment.addr found${NC}"
fi

if [ ! -f "$WALLET_DIR/payment.skey" ]; then
    echo -e "${RED}❌ payment.skey not found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ payment.skey found${NC}"
fi

if [ ! -f "$WALLET_DIR/payment.vkey" ]; then
    echo -e "${RED}❌ payment.vkey not found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ payment.vkey found${NC}"
fi
echo ""

# Check 3: Node socket
SOCKET_PATH="$TARGET_DIR/db/node.socket"
echo "🔌 Checking node socket at $SOCKET_PATH..."

if [ ! -S "$SOCKET_PATH" ]; then
    echo -e "${RED}❌ Node socket not found${NC}"
    echo "   Start your cardano-node first!"
    exit 1
else
    echo -e "${GREEN}✅ Node socket exists${NC}"
fi

# Check if node is actually responding
if timeout 3 cardano-cli conway query tip --testnet-magic 1 --socket-path "$SOCKET_PATH" &>/dev/null; then
    echo -e "${GREEN}✅ Node is responding${NC}"
else
    echo -e "${RED}❌ Node socket exists but not responding${NC}"
    echo "   Is cardano-node running?"
    echo ""
    echo "   To check: ps aux | grep cardano-node"
    echo "   To start: (follow your node setup instructions)"
    exit 1
fi
echo ""

# Check 4: cardano-cli
echo "🛠️  Checking tools..."
if ! command -v cardano-cli &> /dev/null; then
    echo -e "${RED}❌ cardano-cli not found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ cardano-cli found: $(cardano-cli --version | head -1)${NC}"
fi

if ! command -v aiken &> /dev/null; then
    echo -e "${RED}❌ aiken not found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ aiken found: $(aiken --version)${NC}"
fi
echo ""

# Check 5: Wallet balance
echo "💰 Checking wallet balance..."
WALLET_ADDR=$(cat "$WALLET_DIR/payment.addr")
echo "   Address: $WALLET_ADDR"

BALANCE=$(cardano-cli conway query utxo \
  --address "$WALLET_ADDR" \
  --testnet-magic 1 \
  --socket-path "$SOCKET_PATH" \
  --output-json | jq -r 'to_entries | map(.value.value.lovelace) | add // 0')

if [ "$BALANCE" -lt 105000000 ]; then
    echo -e "${RED}❌ Insufficient balance: $BALANCE lovelace${NC}"
    echo "   Need at least 105 ADA (105000000 lovelace)"
    echo "   Get testnet ADA from: https://docs.cardano.org/cardano-testnet/tools/faucet"
    exit 1
else
    ADA=$(echo "scale=2; $BALANCE / 1000000" | bc)
    echo -e "${GREEN}✅ Sufficient balance: $ADA ADA${NC}"
fi
echo ""

# Check 6: Aiken compilation
echo "🔨 Checking Aiken contract compilation..."
cd "$(dirname "$0")/.."
if aiken build &>/dev/null; then
    echo -e "${GREEN}✅ Aiken contract compiles successfully${NC}"
    
    SCRIPT_ADDR=$(aiken blueprint address --module campaign --validator campaign)
    echo "   Script address: $SCRIPT_ADDR"
else
    echo -e "${RED}❌ Aiken compilation failed${NC}"
    exit 1
fi
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
echo "=============================================="
echo ""
echo "Ready to deploy! Run:"
echo ""
echo -e "${BLUE}  export TARGET_DIR=\"$TARGET_DIR\"${NC}"
echo -e "${BLUE}  ./scripts/deploy-preprod.sh${NC}"
echo ""

