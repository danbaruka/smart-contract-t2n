# Task2Earn Smart Contract

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Cardano](https://img.shields.io/badge/Cardano-Preprod-blue.svg)](https://preprod.cardanoscan.io/)
[![Plutus](https://img.shields.io/badge/Plutus-V3-purple.svg)](https://plutus.readthedocs.io/)
[![Aiken](https://img.shields.io/badge/Aiken-v1.x-green.svg)](https://aiken-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

Professional Cardano smart contract for gamified task completion rewards using Merkle proof distribution.

## 🎯 Overview

A Plutus V3 smart contract enabling:
- ✅ Campaign-based reward distribution
- ✅ Merkle proof claim verification
- ✅ Owner-controlled campaign lifecycle
- ✅ Secure participant authentication
- ✅ Gas-efficient O(log n) verification

## 🏗️ Architecture

```
Campaign (Active) → Finalize (SetRoot) → Ended → Claims → Complete
                 ↓                                  ↓
               Pause ← → Resume              Cancel (emergency)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Cardano node (Preprod testnet)
- Aiken compiler
- Wallet with testnet ADA

### Installation
```bash
npm install
```

### Deployment
```bash
export TARGET_DIR="$HOME/cardano-testnet"
./scripts/deploy-preprod.sh
```

### Testing
```bash
# Off-chain tests (no node required)
npx tsx scripts/test-full-lifecycle.ts

# On-chain tests (node required)
./scripts/onchain-test-suite.sh
```

## 📂 Project Structure

```
smartcontract/
├── src/
│   ├── offchain/          # Off-chain utilities
│   │   ├── merkle-tree.ts # Merkle tree implementation
│   │   ├── tx-builder.ts  # Transaction builders
│   │   └── query.ts       # Blockchain queries
│   └── types/             # TypeScript types
│       ├── datum.ts       # Campaign datum
│       └── redeemer.ts    # Redeemer types
├── validators/
│   └── campaign.ak        # Aiken validator (Plutus V3)
├── scripts/
│   ├── deploy-preprod.sh  # Deployment automation
│   ├── test-full-lifecycle.ts  # Full test suite
│   ├── onchain-test-suite.sh   # On-chain validation
│   ├── check-setup.sh     # Prerequisites checker
│   └── test-node.sh       # Node connection test
├── plutus.json            # Compiled contract
├── aiken.toml             # Aiken configuration
└── package.json           # NPM dependencies
```

## 🔐 Contract Features

### Datum Structure
```typescript
{
  owner: ByteArray,           // Campaign owner PKH
  merkleRoot: ByteArray,      // Distribution Merkle root
  poolAmount: Int,            // Total reward pool
  totalClaimed: Int,          // Total claimed so far
  claimsCount: Int,           // Number of claims
  status: Int                 // 0=Active, 1=Paused, 2=Ended, 3=Cancelled
}
```

### Redeemer Actions
- **Claim**: Participant claims reward with Merkle proof
- **Finalize**: Owner commits Merkle root (SetRoot)
- **Cancel**: Owner cancels campaign
- **Pause**: Owner pauses claims
- **Resume**: Owner resumes paused campaign

## 🧪 Testing

### Run All Tests
```bash
npm test
npx tsx scripts/test-full-lifecycle.ts
./scripts/onchain-test-suite.sh
```

### Test Coverage
- ✅ Merkle tree generation & verification
- ✅ Proof validation (valid & invalid)
- ✅ Amount tampering detection
- ✅ Address spoofing prevention
- ✅ Campaign ID isolation
- ✅ On-chain datum validation
- ✅ Transaction building

## 📊 Performance

| Metric | Value |
|--------|-------|
| Script Size | 2,005 bytes |
| Deployment Fee | ~172,541 lovelace |
| Claim Fee | ~168,625 lovelace |
| Proof Size | O(log n) - 2 hashes for 3 participants |
| Verification | O(log n) complexity |

## 🔗 Integration

### Generate Merkle Tree
```typescript
import { MerkleTree } from './src/offchain/merkle-tree';

const participants = [
  { address: 'addr_test1...', amount: 50000000n },
  { address: 'addr_test1...', amount: 30000000n },
];

const tree = new MerkleTree(participants, 'campaign-id');
const root = tree.getRoot();
```

### Get Claim Proof
```typescript
const proof = tree.getProof(participantAddress);
// Submit claim transaction with proof
```

## 🛠️ Scripts

| Script | Purpose |
|--------|---------|
| `deploy-preprod.sh` | Deploy to Preprod testnet |
| `test-full-lifecycle.ts` | Off-chain lifecycle tests |
| `onchain-test-suite.sh` | On-chain validation (15 tests) |
| `check-setup.sh` | Verify prerequisites |
| `test-node.sh` | Test node connection |

## 📝 Environment

```bash
export TARGET_DIR="$HOME/cardano-testnet"
export SOCKET_PATH="$TARGET_DIR/db/node.socket"
export TESTNET_MAGIC=1
```

## 🔒 Security

- ✅ Merkle proof verification
- ✅ Owner authorization (PKH)
- ✅ Balance protection
- ✅ Status enforcement
- ✅ Campaign isolation
- ✅ Amount tampering detection

### Report Security Vulnerabilities

**⚠️ DO NOT create public GitHub issues for security vulnerabilities.**

Please report security issues privately to: **danamphred@gmail.com**

See [SECURITY.md](./SECURITY.md) for:
- Responsible disclosure process
- Bug bounty program ($50-$2,000 for valid findings)
- Security best practices
- Audit status

We are committed to addressing security issues promptly and crediting researchers.

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

### Key Points:
- ✅ **Free for**: Education, research, auditing, transparency, personal projects, non-profit use
- ❌ **Not allowed**: Commercial use, for-profit services, selling/licensing for monetary gain
- 📧 **Commercial inquiries**: danamphred@gmail.com

See [LICENSE](./LICENSE) for full details.

### Why This License?

We believe in **transparency and auditability** for blockchain smart contracts while protecting intellectual property rights. This license allows:

- 🔍 **Public Auditing** - Anyone can review the code for security
- 📚 **Learning** - Students and developers can study and learn
- 🧪 **Testing** - Researchers can experiment and improve
- 🤝 **Collaboration** - Community can contribute improvements

For commercial use, please contact us for licensing options.

## 🤝 Contributing

We welcome contributions from the community! Please read our guidelines before submitting:

- 📖 [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- 🤝 [Code of Conduct](./CODE_OF_CONDUCT.md) - Community standards
- 🔒 [Security Policy](./SECURITY.md) - Report vulnerabilities
- 📋 [Changelog](./CHANGELOG.md) - Version history
- 🏆 [Contributors](./CONTRIBUTORS.md) - Hall of fame

### Quick Start for Contributors

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/task2earn-smartcontract.git

# Install dependencies
npm install

# Run tests
npm test
npx tsx scripts/test-full-lifecycle.ts

# Make your changes and submit a PR
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

**Version:** 1.0.0  
**Network:** Cardano Preprod Testnet  
**Plutus Version:** V3 (Conway era)  
**Language:** TypeScript + Aiken
