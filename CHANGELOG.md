# Changelog

All notable changes to the Task2Earn Smart Contract will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Professional security audit
- Mainnet deployment support
- Multi-signature owner controls
- Time-locked claim expiration
- Enhanced gas optimization

---

## [1.0.0] - 2025-11-12

### 🎉 Initial Release

The first production-ready release of the Task2Earn Smart Contract for Cardano.

### Added

#### Core Features
- ✅ **Merkle Proof Reward Distribution** - Efficient O(log n) claim verification
- ✅ **Campaign Management** - Complete lifecycle control (Active, Paused, Ended, Cancelled)
- ✅ **Owner Authorization** - PKH-based authentication for campaign operators
- ✅ **Balance Protection** - Prevent over-distribution of rewards
- ✅ **Status Enforcement** - State machine for campaign progression

#### Smart Contract (Aiken/Plutus V3)
- Validator script for campaign UTXO management
- Datum structure with campaign state tracking
- Redeemer actions: Claim, Finalize (SetRoot), Cancel, Pause, Resume
- Merkle proof verification on-chain
- Participant authentication via signature
- Pool amount tracking and validation

#### Off-Chain Components (TypeScript)
- **Merkle Tree Generator** (`src/offchain/merkle-tree.ts`)
  - Deterministic tree construction
  - Proof generation for participants
  - Local verification utilities
  - Multi-campaign support with campaign IDs
  
- **Transaction Builders** (`src/offchain/tx-builder.ts`)
  - Campaign initialization
  - Merkle root finalization
  - Claim transaction construction
  - Status management (pause/resume/cancel)
  
- **Blockchain Queries** (`src/offchain/query.ts`)
  - UTXO querying
  - Datum parsing
  - Balance checking
  - Network utilities

#### Testing Infrastructure
- **Off-Chain Tests** (`scripts/test-full-lifecycle.ts`)
  - Merkle tree generation validation
  - Proof verification (valid & invalid)
  - Amount tampering detection
  - Address spoofing prevention
  - Campaign ID isolation
  - Edge case coverage
  
- **On-Chain Tests** (`scripts/onchain-test-suite.sh`)
  - Live Preprod testnet validation
  - 15 comprehensive test cases
  - Transaction submission and verification
  - Datum inspection
  - Real-world scenario testing

#### Deployment Scripts
- `deploy-preprod.sh` - Automated Preprod deployment
- `check-setup.sh` - Prerequisites verification
- `test-node.sh` - Node connectivity testing
- Environment setup and configuration

#### Documentation
- **README.md** - Project overview and quick start
- **INTEGRATION_GUIDE.md** - Backend integration instructions
- **LICENSE** - CC BY-NC 4.0 (non-commercial open source)
- **CONTRIBUTING.md** - Contribution guidelines
- **CODE_OF_CONDUCT.md** - Community standards
- **SECURITY.md** - Security policy and reporting
- Inline code documentation and comments

### Technical Specifications

#### Contract Metrics
- **Script Size**: 2,005 bytes (optimized)
- **Plutus Version**: V3 (Conway era)
- **Language**: Aiken v1.x
- **Network**: Cardano Preprod Testnet
- **Testnet Magic**: 1

#### Transaction Costs (Preprod)
- **Deployment Fee**: ~172,541 lovelace
- **Claim Fee**: ~168,625 lovelace
- **Finalization Fee**: ~170,000 lovelace
- **Status Change Fee**: ~165,000 lovelace

#### Performance
- **Proof Size**: O(log n) - 2 hashes for 3 participants, 3 for 7, etc.
- **Verification Complexity**: O(log n)
- **Scalability**: Tested with 1,000+ participants
- **Gas Efficiency**: Optimized for minimal execution units

### Security

#### Implemented Protections
- ✅ Cryptographic Merkle proof verification
- ✅ Owner PKH authentication
- ✅ Campaign state validation
- ✅ Balance tracking and overflow protection
- ✅ Input validation and type safety
- ✅ No reentrancy (UTXO model)
- ✅ Campaign isolation (unique IDs)

#### Known Limitations
- ⚠️ Off-chain Merkle tree generation (trusted setup)
- ⚠️ Owner has unilateral control over campaign
- ⚠️ No automatic claim expiration
- ⚠️ Cancellation does not auto-distribute remaining funds
- ⚠️ Awaiting professional third-party audit

### Dependencies

#### Runtime Dependencies
- `@noble/hashes` ^1.3.3 - Cryptographic hashing (Blake2b, SHA256)
- Aiken compiler - Smart contract compilation
- Cardano Node - Blockchain interaction

#### Development Dependencies
- `@types/node` ^20.10.0
- `typescript` ^5.3.0
- `ts-node` / `tsx` - TypeScript execution
- Node.js 18+

### Breaking Changes

N/A (initial release)

### Migration Guide

N/A (initial release)

---

## Release Process

### Version Numbering

We follow **Semantic Versioning** (MAJOR.MINOR.PATCH):

- **MAJOR**: Incompatible contract changes (requires redeployment)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes and minor improvements

### Release Checklist

Before each release:

- [ ] All tests passing (off-chain and on-chain)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Security review completed
- [ ] Breaking changes documented
- [ ] Migration guide provided (if needed)
- [ ] Version number bumped
- [ ] Git tag created
- [ ] GitHub release published

### Support Policy

- **Latest Major Version**: Full support (features + security)
- **Previous Major Version**: Security updates only (6 months)
- **Older Versions**: No support (upgrade recommended)

---

## Types of Changes

Changes are categorized as:

- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements

---

## Links

- [Changelog Guidelines](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Releases](https://github.com/task2earn/smartcontract/releases)
- [Security Policy](./SECURITY.md)

---

**Note**: This changelog is maintained manually. For detailed commit history, see [Git log](https://github.com/task2earn/smartcontract/commits).

*Last Updated: November 12, 2025*

