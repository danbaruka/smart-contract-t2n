# Task2Earn Smart Contract - Scripts

## 📁 Production Scripts

### 🚀 Deployment
**`deploy-preprod.sh`** - Full automated deployment to Cardano Preprod Testnet
- Compiles Aiken contract to Plutus V3
- Queries wallet and node
- Builds, signs, and submits deployment transaction
- Returns transaction hash
- **Usage:** `export TARGET_DIR="$HOME/cardano-testnet" && ./scripts/deploy-preprod.sh`

### 🧪 Testing
**`test-full-lifecycle.ts`** - Comprehensive off-chain lifecycle testing
- Generates Merkle trees with test participants
- Creates and verifies proofs
- Tests security (amount tampering, wrong address, etc.)
- Generates transaction data (datums, redeemers)
- **Usage:** `npx tsx scripts/test-full-lifecycle.ts`

**`onchain-test-suite.sh`** - Complete on-chain validation suite
- Queries and validates script UTxO
- Verifies datum structure and values
- Tests security checks (15 tests total)
- Validates Merkle proof system
- Tests transaction building
- **Usage:** `export TARGET_DIR="$HOME/cardano-testnet" && ./scripts/onchain-test-suite.sh`

### 🔧 Utilities
**`check-setup.sh`** - Prerequisites and environment checker
- Validates wallet files
- Checks node connection
- Verifies tools (cardano-cli, aiken, jq)
- Tests wallet balance
- **Usage:** `export TARGET_DIR="$HOME/cardano-testnet" && ./scripts/check-setup.sh`

**`test-node.sh`** - Quick node connection test
- Tests cardano-node socket connection
- Queries chain tip
- **Usage:** `export TARGET_DIR="$HOME/cardano-testnet" && ./scripts/test-node.sh`

---

## 🎯 Quick Start

### 1. Check Setup
```bash
export TARGET_DIR="$HOME/cardano-testnet"
./scripts/check-setup.sh
```

### 2. Run Off-Chain Tests
```bash
npx tsx scripts/test-full-lifecycle.ts
```

### 3. Deploy Contract
```bash
./scripts/deploy-preprod.sh
```

### 4. Run On-Chain Tests
```bash
./scripts/onchain-test-suite.sh
```

---

## 📊 Script Summary

| Script | Type | Purpose | Node Required |
|--------|------|---------|---------------|
| `deploy-preprod.sh` | Deployment | Deploy to Preprod | ✅ Yes |
| `test-full-lifecycle.ts` | Testing | Off-chain tests | ❌ No |
| `onchain-test-suite.sh` | Testing | On-chain validation | ✅ Yes |
| `check-setup.sh` | Utility | Prerequisites check | ✅ Yes |
| `test-node.sh` | Utility | Node connection test | ✅ Yes |

---

## 🔒 Environment Variables

All scripts use these environment variables:

- **`TARGET_DIR`** - Path to cardano-testnet directory (default: `$HOME/cardano-testnet`)
- **`SOCKET_PATH`** - Cardano node socket path (default: `$TARGET_DIR/db/node.socket`)
- **`TESTNET_MAGIC`** - Network magic number (default: `1` for Preprod)

---

## 📝 Notes

- All scripts are production-ready and tested
- Scripts follow professional error handling
- Colorized output for better readability
- Comprehensive validation and checks
- Generate JSON reports for automation

---

**Version:** 1.0.0  
**Last Updated:** $(date +"%Y-%m-%d")

