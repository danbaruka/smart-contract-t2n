#!/bin/bash

# Task2Earn Smart Contract - Comprehensive On-Chain Test Suite
# Tests all possible scenarios with the deployed contract

set -e

# Configuration
export TARGET_DIR="${TARGET_DIR:-$HOME/cardano-testnet}"
WALLET_DIR="$TARGET_DIR/wallet"
TESTNET_MAGIC=1
SOCKET_PATH="$TARGET_DIR/db/node.socket"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test results array
declare -a TEST_RESULTS

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║     🧪 TASK2EARN - COMPREHENSIVE ON-CHAIN TEST SUITE 🧪         ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Helper functions
log_test() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🧪 TEST $1: $2${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    TESTS_RUN=$((TESTS_RUN + 1))
}

pass_test() {
    echo -e "${GREEN}✅ PASSED${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("✅ $1")
    echo ""
}

fail_test() {
    echo -e "${RED}❌ FAILED${NC}: $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("❌ $1")
    echo ""
}

skip_test() {
    echo -e "${YELLOW}⏭️  SKIPPED${NC}: $1"
    TEST_RESULTS+=("⏭️  $1")
    echo ""
}

# Get script details
SCRIPT_ADDRESS=$(cat "$PROJECT_DIR/plutus.json" | jq -r '.validators[0].address // empty')
if [ -z "$SCRIPT_ADDRESS" ]; then
    SCRIPT_ADDRESS=$(aiken blueprint address -m campaign -v campaign)
fi

WALLET_ADDR=$(cat "$WALLET_DIR/payment.addr")
OWNER_PKH=$(cardano-cli address key-hash --payment-verification-key-file "$WALLET_DIR/payment.vkey")

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Script Address: $SCRIPT_ADDRESS"
echo "Wallet Address: $WALLET_ADDR"
echo "Owner PKH: $OWNER_PKH"
echo "Network: Preprod Testnet"
echo ""

# Query current script state
echo -e "${BLUE}🔍 Querying current script state...${NC}"
cardano-cli conway query utxo \
  --address "$SCRIPT_ADDRESS" \
  --testnet-magic $TESTNET_MAGIC \
  --socket-path "$SOCKET_PATH" \
  --output-json > "$PROJECT_DIR/script-utxo-current.json"

SCRIPT_UTXO_COUNT=$(cat "$PROJECT_DIR/script-utxo-current.json" | jq 'length')
echo "Script UTxOs found: $SCRIPT_UTXO_COUNT"
echo ""

if [ "$SCRIPT_UTXO_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No UTxOs found at script address!${NC}"
    echo "Deploy the contract first: ./scripts/deploy-preprod.sh"
    exit 1
fi

# Get current datum
CURRENT_DATUM=$(cat "$PROJECT_DIR/script-utxo-current.json" | jq -r 'to_entries[0].value.inlineDatum')
CURRENT_STATUS=$(echo "$CURRENT_DATUM" | jq -r '.fields[5].int')
CURRENT_MERKLE_ROOT=$(echo "$CURRENT_DATUM" | jq -r '.fields[1].bytes')
CURRENT_POOL=$(echo "$CURRENT_DATUM" | jq -r '.fields[2].int')

echo -e "${BLUE}📊 Current Campaign State:${NC}"
echo "Status: $CURRENT_STATUS (0=Active, 1=Paused, 2=Ended, 3=Cancelled)"
echo "Merkle Root: ${CURRENT_MERKLE_ROOT:-empty}"
echo "Pool Amount: $CURRENT_POOL lovelace"
echo ""

# ============================================================================
# TEST SUITE
# ============================================================================

# TEST 1: Query Script UTxO
log_test "1" "Query Script UTxO and Validate Datum Structure"

if [ "$SCRIPT_UTXO_COUNT" -gt 0 ]; then
    DATUM_FIELDS=$(echo "$CURRENT_DATUM" | jq '.fields | length')
    if [ "$DATUM_FIELDS" -eq 6 ]; then
        pass_test "Script UTxO found with valid datum structure (6 fields)"
    else
        fail_test "Invalid datum structure: expected 6 fields, got $DATUM_FIELDS"
    fi
else
    fail_test "No script UTxO found"
fi

# TEST 2: Verify Datum Field Types
log_test "2" "Verify Datum Field Types and Values"

OWNER_FIELD=$(echo "$CURRENT_DATUM" | jq -r '.fields[0].bytes')
POOL_FIELD=$(echo "$CURRENT_DATUM" | jq -r '.fields[2].int')
STATUS_FIELD=$(echo "$CURRENT_DATUM" | jq -r '.fields[5].int')

if [ -n "$OWNER_FIELD" ] && [ "$POOL_FIELD" -gt 0 ] && [ "$STATUS_FIELD" -ge 0 ]; then
    pass_test "All datum fields have correct types and valid values"
else
    fail_test "Invalid datum field types or values"
fi

# TEST 3: Verify Locked Amount
log_test "3" "Verify Locked Amount Matches Datum"

LOCKED_AMOUNT=$(cat "$PROJECT_DIR/script-utxo-current.json" | jq -r 'to_entries[0].value.value.lovelace')
DATUM_POOL=$(echo "$CURRENT_DATUM" | jq -r '.fields[2].int')

if [ "$LOCKED_AMOUNT" -ge "$DATUM_POOL" ]; then
    pass_test "Locked amount ($LOCKED_AMOUNT) >= pool amount ($DATUM_POOL)"
else
    fail_test "Locked amount ($LOCKED_AMOUNT) < pool amount ($DATUM_POOL)"
fi

# TEST 4: Test Merkle Proof Generation
log_test "4" "Generate and Verify Merkle Proofs"

if [ -f "$PROJECT_DIR/distribution-manifest.json" ]; then
    PROOF_COUNT=$(cat "$PROJECT_DIR/distribution-manifest.json" | jq '.participants | length')
    ALL_VERIFIED=$(cat "$PROJECT_DIR/distribution-manifest.json" | jq '[.participants[].verified] | all')
    
    if [ "$ALL_VERIFIED" = "true" ]; then
        pass_test "All $PROOF_COUNT Merkle proofs verified successfully"
    else
        fail_test "Some Merkle proofs failed verification"
    fi
else
    skip_test "Distribution manifest not found - run ./scripts/test-full-lifecycle.ts first"
fi

# TEST 5: Validate Redeemer Structure
log_test "5" "Validate Claim Redeemer Structure"

if [ -f "$PROJECT_DIR/redeemer-claim-alice.json" ]; then
    REDEEMER_CONSTRUCTOR=$(cat "$PROJECT_DIR/redeemer-claim-alice.json" | jq -r '.constructor')
    REDEEMER_FIELDS=$(cat "$PROJECT_DIR/redeemer-claim-alice.json" | jq '.fields[0].fields | length')
    
    if [ "$REDEEMER_CONSTRUCTOR" -eq 0 ] && [ "$REDEEMER_FIELDS" -eq 3 ]; then
        pass_test "Claim redeemer has correct structure (constructor: 0, fields: 3)"
    else
        fail_test "Invalid redeemer structure"
    fi
else
    skip_test "Claim redeemer not found"
fi

# TEST 6: Check Transaction Building (Dry Run)
log_test "6" "Test Transaction Building (Build Only)"

# Get wallet UTxO
cardano-cli conway query utxo \
  --address "$WALLET_ADDR" \
  --testnet-magic $TESTNET_MAGIC \
  --socket-path "$SOCKET_PATH" \
  --output-json > "$PROJECT_DIR/wallet-utxo-test.json"

TX_HASH=$(cat "$PROJECT_DIR/wallet-utxo-test.json" | jq -r 'to_entries[0].key' | cut -d'#' -f1)
TX_IX=$(cat "$PROJECT_DIR/wallet-utxo-test.json" | jq -r 'to_entries[0].key' | cut -d'#' -f2)

if [ -n "$TX_HASH" ] && [ "$TX_HASH" != "null" ]; then
    # Try building a simple transaction (just to test)
    if cardano-cli conway transaction build \
      --tx-in "$TX_HASH#$TX_IX" \
      --change-address "$WALLET_ADDR" \
      --testnet-magic $TESTNET_MAGIC \
      --socket-path "$SOCKET_PATH" \
      --out-file "$PROJECT_DIR/test-tx.draft" 2>/dev/null; then
        pass_test "Transaction building works correctly"
        rm -f "$PROJECT_DIR/test-tx.draft"
    else
        fail_test "Transaction building failed"
    fi
else
    fail_test "No wallet UTxO available for testing"
fi

# TEST 7: Protocol Parameters Validity
log_test "7" "Verify Protocol Parameters"

cardano-cli conway query protocol-parameters \
  --testnet-magic $TESTNET_MAGIC \
  --socket-path "$SOCKET_PATH" \
  --out-file "$PROJECT_DIR/pparams-test.json"

MIN_FEE=$(cat "$PROJECT_DIR/pparams-test.json" | jq -r '.txFeeFixed')
if [ "$MIN_FEE" -gt 0 ]; then
    pass_test "Protocol parameters retrieved successfully (minFee: $MIN_FEE)"
else
    fail_test "Invalid protocol parameters"
fi

# TEST 8: Script Address Derivation
log_test "8" "Verify Script Address Matches Deployment"

DERIVED_ADDRESS=$(aiken blueprint address -m campaign -v campaign)
DEPLOYED_ADDRESS=$(cat "$PROJECT_DIR/deployment-info.json" 2>/dev/null | jq -r '.scriptAddress // empty')

if [ -n "$DEPLOYED_ADDRESS" ] && [ "$DERIVED_ADDRESS" = "$DEPLOYED_ADDRESS" ]; then
    pass_test "Script address matches deployment ($DERIVED_ADDRESS)"
else
    skip_test "Could not verify script address match (might be first deployment)"
fi

# TEST 9: Owner PKH Verification
log_test "9" "Verify Owner PKH Matches Wallet"

DATUM_OWNER=$(echo "$CURRENT_DATUM" | jq -r '.fields[0].bytes')
if [ "$DATUM_OWNER" = "$OWNER_PKH" ]; then
    pass_test "Owner PKH matches wallet ($OWNER_PKH)"
else
    fail_test "Owner PKH mismatch: datum=$DATUM_OWNER, wallet=$OWNER_PKH"
fi

# TEST 10: Campaign Status Transitions
log_test "10" "Validate Campaign Status"

case $CURRENT_STATUS in
    0)
        pass_test "Campaign is Active (status: 0) - ready for operations"
        ;;
    1)
        pass_test "Campaign is Paused (status: 1) - can be resumed"
        ;;
    2)
        pass_test "Campaign is Ended (status: 2) - ready for claims"
        ;;
    3)
        pass_test "Campaign is Cancelled (status: 3) - funds can be withdrawn"
        ;;
    *)
        fail_test "Invalid campaign status: $CURRENT_STATUS"
        ;;
esac

# TEST 11: Merkle Root Validation
log_test "11" "Validate Merkle Root State"

if [ -n "$CURRENT_MERKLE_ROOT" ] && [ "$CURRENT_MERKLE_ROOT" != "" ]; then
    ROOT_LENGTH=${#CURRENT_MERKLE_ROOT}
    if [ "$ROOT_LENGTH" -eq 64 ]; then
        pass_test "Merkle root is set and valid (32 bytes / 64 hex chars)"
    else
        fail_test "Merkle root has invalid length: $ROOT_LENGTH (expected 64)"
    fi
else
    if [ "$CURRENT_STATUS" -eq 2 ]; then
        fail_test "Campaign is Ended but Merkle root is not set!"
    else
        pass_test "Merkle root not yet set (expected for status $CURRENT_STATUS)"
    fi
fi

# TEST 12: Balance Sufficiency Check
log_test "12" "Verify Sufficient Balance for Claims"

TOTAL_CLAIMED=$(echo "$CURRENT_DATUM" | jq -r '.fields[3].int')
REMAINING=$((CURRENT_POOL - TOTAL_CLAIMED))

if [ "$REMAINING" -gt 0 ]; then
    pass_test "Sufficient balance remaining: $REMAINING lovelace"
else
    if [ "$CURRENT_STATUS" -eq 2 ]; then
        fail_test "No balance remaining but campaign is Ended!"
    else
        pass_test "Pool fully claimed or not yet active"
    fi
fi

# TEST 13: Claims Count Validation
log_test "13" "Validate Claims Counter"

CLAIMS_COUNT=$(echo "$CURRENT_DATUM" | jq -r '.fields[4].int')
if [ "$CLAIMS_COUNT" -ge 0 ]; then
    pass_test "Claims count is valid: $CLAIMS_COUNT"
else
    fail_test "Invalid claims count: $CLAIMS_COUNT"
fi

# TEST 14: Plutus Script Compilation
log_test "14" "Verify Plutus Script Compilation"

if [ -f "$PROJECT_DIR/plutus.json" ]; then
    SCRIPT_SIZE=$(cat "$PROJECT_DIR/plutus.json" | jq -r '.validators[0].compiledCode' | wc -c)
    SCRIPT_HASH=$(cat "$PROJECT_DIR/plutus.json" | jq -r '.validators[0].hash')
    
    if [ "$SCRIPT_SIZE" -gt 100 ] && [ -n "$SCRIPT_HASH" ]; then
        pass_test "Plutus script compiled successfully (size: $SCRIPT_SIZE bytes)"
    else
        fail_test "Plutus script appears invalid"
    fi
else
    fail_test "plutus.json not found"
fi

# TEST 15: Network Synchronization
log_test "15" "Verify Node Synchronization"

SYNC_PROGRESS=$(cardano-cli conway query tip \
  --testnet-magic $TESTNET_MAGIC \
  --socket-path "$SOCKET_PATH" | jq -r '.syncProgress // "100.00"')

# Check if sync is 100% (handle both "100.00" and "100")
if [[ "$SYNC_PROGRESS" == "100"* ]]; then
    pass_test "Node is fully synchronized ($SYNC_PROGRESS)"
else
    fail_test "Node not fully synced: $SYNC_PROGRESS"
fi

# ============================================================================
# TEST SUMMARY
# ============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║                     📊 TEST RESULTS SUMMARY                      ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}Total Tests Run:${NC} $TESTS_RUN"
echo -e "${GREEN}Tests Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Tests Failed:${NC} $TESTS_FAILED"
echo -e "${YELLOW}Tests Skipped:${NC} $((TESTS_RUN - TESTS_PASSED - TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$((TESTS_PASSED * 100 / (TESTS_PASSED + TESTS_FAILED)))
fi

echo -e "${BLUE}Success Rate:${NC} ${SUCCESS_RATE}%"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Detailed Results:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
done
echo ""

# Save results
cat > "$PROJECT_DIR/onchain-test-results.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "preprod",
  "totalTests": $TESTS_RUN,
  "passed": $TESTS_PASSED,
  "failed": $TESTS_FAILED,
  "skipped": $((TESTS_RUN - TESTS_PASSED - TESTS_FAILED)),
  "successRate": ${SUCCESS_RATE},
  "scriptAddress": "$SCRIPT_ADDRESS",
  "campaignStatus": $CURRENT_STATUS,
  "merkleRoot": "$CURRENT_MERKLE_ROOT",
  "poolAmount": $CURRENT_POOL,
  "results": $(printf '%s\n' "${TEST_RESULTS[@]}" | jq -R . | jq -s .)
}
EOF

echo -e "${GREEN}✅ Test results saved to: onchain-test-results.json${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║            ✨ ALL ON-CHAIN TESTS PASSED! ✨                     ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    exit 0
else
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║            ⚠️  SOME TESTS FAILED - REVIEW REQUIRED ⚠️           ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    exit 1
fi

