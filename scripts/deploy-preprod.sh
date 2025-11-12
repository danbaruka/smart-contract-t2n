#!/bin/bash

# Task2Earn Smart Contract - Full Deployment to Preprod
# This script builds, compiles to Aiken, and deploys to Cardano Preprod testnet

set -e  # Exit on error

echo "🚀 Task2Earn Smart Contract - Preprod Deployment"
echo "=================================================="
echo ""

# Configuration
WALLET_DIR="$HOME/cardano-testnet/wallet"
TESTNET_MAGIC=1
SOCKET_PATH="$TARGET_DIR/db/node.socket"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if [ -z "$TARGET_DIR" ]; then
    echo -e "${YELLOW}⚠️  TARGET_DIR not set, using default${NC}"
    export TARGET_DIR="$HOME/cardano-testnet"
    SOCKET_PATH="$TARGET_DIR/db/node.socket"
fi

if [ ! -f "$WALLET_DIR/payment.addr" ]; then
    echo -e "${RED}❌ Wallet not found at $WALLET_DIR${NC}"
    exit 1
fi

if [ ! -f "$WALLET_DIR/payment.skey" ]; then
    echo -e "${RED}❌ Signing key not found${NC}"
    exit 1
fi

if [ ! -f "$WALLET_DIR/payment.vkey" ]; then
    echo -e "${RED}❌ Verification key not found${NC}"
    exit 1
fi

if ! command -v cardano-cli &> /dev/null; then
    echo -e "${RED}❌ cardano-cli not found${NC}"
    exit 1
fi

if ! command -v aiken &> /dev/null; then
    echo -e "${RED}❌ aiken not found${NC}"
    exit 1
fi

# Check if node is responding
if ! timeout 5 cardano-cli conway query tip --testnet-magic $TESTNET_MAGIC --socket-path "$SOCKET_PATH" &>/dev/null; then
    echo -e "${RED}❌ Cardano node not responding at $SOCKET_PATH${NC}"
    echo -e "${YELLOW}Make sure your node is running:${NC}"
    echo "  cardano-node run --topology topology.json --database-path db --socket-path db/node.socket --port 3001 --config config.json"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 1: Compile with Aiken (skip TypeScript build - using Aiken for on-chain)
echo "🔨 Step 1: Compiling with Aiken to Plutus Core..."
cd "$PROJECT_DIR"
aiken build
echo -e "${GREEN}✅ Aiken compiled successfully${NC}"
echo ""

# Get script address (testnet by default)
SCRIPT_ADDRESS=$(aiken blueprint address -m campaign -v campaign)
echo -e "${BLUE}📍 Script Address: $SCRIPT_ADDRESS${NC}"
echo ""

# Step 2: Query wallet UTxO
echo "🔍 Step 2: Querying wallet UTxO..."
WALLET_ADDR=$(cat "$WALLET_DIR/payment.addr")
echo "Wallet address: $WALLET_ADDR"

cardano-cli conway query utxo \
  --address "$WALLET_ADDR" \
  --testnet-magic $TESTNET_MAGIC \
  --socket-path "$SOCKET_PATH" \
  --output-json > "$PROJECT_DIR/wallet-utxo.json"

# Auto-select largest UTxO
TX_HASH=$(cat "$PROJECT_DIR/wallet-utxo.json" | jq -r 'to_entries | sort_by(.value.value.lovelace) | reverse | .[0].key' | cut -d'#' -f1)
TX_IX=$(cat "$PROJECT_DIR/wallet-utxo.json" | jq -r 'to_entries | sort_by(.value.value.lovelace) | reverse | .[0].key' | cut -d'#' -f2)
AVAILABLE_LOVELACE=$(cat "$PROJECT_DIR/wallet-utxo.json" | jq -r 'to_entries | sort_by(.value.value.lovelace) | reverse | .[0].value.value.lovelace')

if [ -z "$TX_HASH" ] || [ "$TX_HASH" = "null" ]; then
    echo -e "${RED}❌ No UTxO found in wallet${NC}"
    echo "Get testnet ADA from: https://docs.cardano.org/cardano-testnet/tools/faucet"
    exit 1
fi

if [ "$AVAILABLE_LOVELACE" -lt 105000000 ]; then
    ADA=$(echo "scale=2; $AVAILABLE_LOVELACE / 1000000" | bc)
    echo -e "${RED}❌ Insufficient balance: $ADA ADA${NC}"
    echo "Need at least 105 ADA for deployment"
    exit 1
fi

echo -e "${BLUE}UTxO: $TX_HASH#$TX_IX${NC}"
echo -e "${BLUE}Balance: $AVAILABLE_LOVELACE lovelace${NC}"
echo ""

# Step 3: Get protocol parameters
echo "📜 Step 3: Fetching protocol parameters..."
cardano-cli conway query protocol-parameters \
  --testnet-magic $TESTNET_MAGIC \
  --socket-path "$SOCKET_PATH" \
  --out-file "$PROJECT_DIR/pparams.json"
echo -e "${GREEN}✅ Protocol parameters saved${NC}"
echo ""

# Step 4: Create campaign datum
echo "📝 Step 4: Creating campaign datum..."

# Get owner PKH from payment.vkey
OWNER_PKH=$(cardano-cli address key-hash --payment-verification-key-file "$WALLET_DIR/payment.vkey")

# Create initial campaign datum
# Fields: owner, merkle_root (empty), pool_amount, total_claimed, claims_count, status (0=Active)
cat > "$PROJECT_DIR/campaign-datum.json" <<EOF
{
  "constructor": 0,
  "fields": [
    {
      "bytes": "$OWNER_PKH"
    },
    {
      "bytes": ""
    },
    {
      "int": 100000000
    },
    {
      "int": 0
    },
    {
      "int": 0
    },
    {
      "int": 0
    }
  ]
}
EOF

echo -e "${GREEN}✅ Campaign datum created${NC}"
echo "Owner PKH: $OWNER_PKH"
echo "Initial pool: 100 ADA"
echo ""

# Step 5: Build transaction
echo "🏗️  Step 5: Building transaction..."

LOCK_AMOUNT=100000000  # 100 ADA to lock in script
MIN_ADA=2000000        # 2 ADA minimum

cardano-cli conway transaction build \
  --tx-in "$TX_HASH#$TX_IX" \
  --tx-out "$SCRIPT_ADDRESS+$LOCK_AMOUNT" \
  --tx-out-inline-datum-file "$PROJECT_DIR/campaign-datum.json" \
  --change-address "$WALLET_ADDR" \
  --testnet-magic $TESTNET_MAGIC \
  --socket-path "$SOCKET_PATH" \
  --out-file "$PROJECT_DIR/tx-deploy.raw"

echo -e "${GREEN}✅ Transaction built${NC}"
echo ""

# Step 6: Sign transaction
echo "✍️  Step 6: Signing transaction..."
cardano-cli conway transaction sign \
  --tx-body-file "$PROJECT_DIR/tx-deploy.raw" \
  --signing-key-file "$WALLET_DIR/payment.skey" \
  --testnet-magic $TESTNET_MAGIC \
  --out-file "$PROJECT_DIR/tx-deploy.signed"

echo -e "${GREEN}✅ Transaction signed${NC}"
echo ""

# Step 7: Submit transaction
echo "📤 Step 7: Submitting transaction to Preprod..."
TX_HASH_RESULT=$(cardano-cli conway transaction submit \
  --tx-file "$PROJECT_DIR/tx-deploy.signed" \
  --testnet-magic $TESTNET_MAGIC \
  --socket-path "$SOCKET_PATH" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Transaction submitted successfully!${NC}"
else
    echo -e "${RED}❌ Transaction submission failed:${NC}"
    echo "$TX_HASH_RESULT"
    exit 1
fi
echo ""

# Get transaction ID
DEPLOY_TX_ID=$(cardano-cli conway transaction txid --tx-file "$PROJECT_DIR/tx-deploy.signed" | jq -r '.txhash')

echo "=================================================="
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "---------------------------------------------------"
echo -e "Contract: Task2Earn Campaign Validator"
echo -e "Network: Preprod Testnet"
echo -e "Script Address: ${YELLOW}$SCRIPT_ADDRESS${NC}"
echo -e "Transaction Hash: ${YELLOW}$DEPLOY_TX_ID${NC}"
echo -e "Locked Amount: 100 ADA"
echo -e "Owner PKH: $OWNER_PKH"
echo ""
echo -e "${BLUE}📍 View on Preprod Explorer:${NC}"
echo "https://preprod.cardanoscan.io/transaction/$DEPLOY_TX_ID"
echo ""
echo -e "${BLUE}🔍 Query script UTxO:${NC}"
echo "cardano-cli conway query utxo \\"
echo "  --address $SCRIPT_ADDRESS \\"
echo "  --testnet-magic $TESTNET_MAGIC \\"
echo "  --socket-path \$TARGET_DIR/db/node.socket"
echo ""

# Save deployment info
cat > "$PROJECT_DIR/deployment-info.json" <<EOF
{
  "network": "preprod",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "scriptAddress": "$SCRIPT_ADDRESS",
  "transactionHash": "$DEPLOY_TX_ID",
  "ownerPkh": "$OWNER_PKH",
  "lockedAmount": $LOCK_AMOUNT,
  "status": "deployed"
}
EOF

echo -e "${GREEN}✅ Deployment info saved to deployment-info.json${NC}"
echo ""

# Wait for confirmation
echo "⏳ Waiting for transaction confirmation (30 seconds)..."
sleep 30

# Query script address
echo "🔍 Checking script UTxO..."
cardano-cli conway query utxo \
  --address "$SCRIPT_ADDRESS" \
  --testnet-magic $TESTNET_MAGIC \
  --socket-path "$SOCKET_PATH"

echo ""
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Backend: Track participant XP off-chain"
echo "2. Calculate rewards and generate Merkle tree"
echo "3. Submit SetRoot transaction to commit distribution"
echo "4. Participants can claim rewards with proofs"

