# Security Policy

## 🔒 Overview

The Task2Earn Smart Contract handles on-chain reward distribution on Cardano blockchain. Security is our highest priority given the financial nature of smart contracts.

This document outlines our security practices and how to report vulnerabilities.

## 🛡️ Supported Versions

We actively provide security updates for the following versions:

| Version | Supported          | Network | Status |
| ------- | ------------------ | ------- | ------ |
| 1.0.x   | ✅ Yes             | Preprod | Active |
| < 1.0   | ❌ No (deprecated) | Testnet | EOL    |

**Note**: We currently only support Preprod testnet deployment. Mainnet support will be announced separately with additional security audits.

## 🚨 Reporting a Vulnerability

### Critical Security Issues

**⚠️ DO NOT create public GitHub issues for security vulnerabilities.**

If you discover a security vulnerability, please report it privately:

### Reporting Channels

1. **Email** (Preferred for critical issues):
   - **To**: danamphred@gmail.com
   - **Subject**: `[SECURITY] Task2Earn Smart Contract Vulnerability`
   - **Encryption**: PGP encryption encouraged for sensitive details

2. **GitHub Security Advisory** (Alternative):
   - Go to [Security Advisories](https://github.com/task2earn/smartcontract/security/advisories)
   - Click "Report a vulnerability"
   - Fill out the form with details

### What to Include in Your Report

Please provide as much information as possible:

```markdown
## Vulnerability Summary
Brief description of the vulnerability

## Vulnerability Type
- [ ] Smart contract logic flaw
- [ ] Authentication/Authorization bypass
- [ ] Double-spend or replay attack
- [ ] Integer overflow/underflow
- [ ] Merkle proof manipulation
- [ ] Access control issue
- [ ] Other: ___________

## Affected Component
- Validator script
- Merkle tree implementation
- Transaction builder
- Off-chain code
- Other: ___________

## Impact
- Financial loss potential
- Affected users/contracts
- Severity: Critical/High/Medium/Low

## Proof of Concept
Steps to reproduce the vulnerability

## Environment
- Network: Mainnet/Preprod/Preview
- Contract version: 
- Node version:
- Aiken version:

## Suggested Fix (optional)
Your recommendations for fixing the issue

## Discoverer
- Name (optional):
- Contact:
- Attribution preference:
```

## 📋 Response Timeline

We are committed to addressing security issues promptly:

| Severity | Initial Response | Status Update | Target Fix | Public Disclosure |
|----------|-----------------|---------------|------------|-------------------|
| **Critical** | < 24 hours | Daily | 7 days | 30 days after fix |
| **High** | < 48 hours | Every 3 days | 14 days | 60 days after fix |
| **Medium** | < 7 days | Weekly | 30 days | 90 days after fix |
| **Low** | < 14 days | Bi-weekly | 90 days | Next release |

### Severity Definitions

**Critical** 🔴
- Loss of funds possible
- Contract can be completely compromised
- Affects all users immediately
- Example: Merkle root manipulation allowing arbitrary claims

**High** 🟠
- Significant financial or data loss possible
- Affects specific user groups or scenarios
- Requires specific conditions to exploit
- Example: Campaign owner can drain funds beyond intended amount

**Medium** 🟡
- Limited financial impact
- Requires complex conditions or privileged access
- Affects edge cases
- Example: Race condition in claim processing

**Low** 🟢
- Minimal or no financial impact
- Information disclosure
- Best practice violations
- Example: Inefficient gas usage

## 🔍 Security Audit Status

### Completed Audits

| Date | Auditor | Version | Report | Findings |
|------|---------|---------|--------|----------|
| TBD | Pending | 1.0.0 | - | - |

**Note**: Currently awaiting professional security audit. Community audits welcome!

### Known Issues & Limitations

We maintain transparency about known limitations:

**Current Limitations:**
- ⚠️ Campaign cancellation does not distribute remaining funds to participants
- ⚠️ No time-based claim expiration (claims remain valid indefinitely)
- ⚠️ Owner has unilateral control over campaign status
- ⚠️ Merkle tree generation is off-chain (trusted setup)

**Mitigations:**
- Clear documentation of owner responsibilities
- Off-chain verification tools available
- Community oversight through transparent code

## 🛠️ Security Best Practices

### For Contract Deployers

1. **Test Thoroughly**
   - Run full test suite before deployment
   - Test on Preprod testnet extensively
   - Simulate various attack scenarios

2. **Verify Merkle Trees**
   - Generate trees deterministically
   - Store root hash off-chain for verification
   - Publish participant list publicly

3. **Monitor Campaigns**
   - Track all transactions
   - Monitor for unusual claim patterns
   - Set up alerts for large claims

4. **Key Management**
   - Secure owner keys with hardware wallets
   - Use multi-signature for high-value campaigns
   - Rotate keys periodically

### For Participants

1. **Verify Claims**
   - Check your allocation in published participant list
   - Verify Merkle proof locally before submitting
   - Confirm contract address matches official deployment

2. **Transaction Safety**
   - Review transaction details before signing
   - Verify recipient addresses
   - Check network fees

3. **Phishing Protection**
   - Only use official contract addresses
   - Verify URLs and links
   - Never share wallet seed phrases

## 🔐 Smart Contract Security Measures

### Implemented Protections

✅ **Merkle Proof Verification**
- Cryptographic verification of claims
- O(log n) proof size for efficiency
- Prevents unauthorized claims

✅ **Owner Authentication**
- Public Key Hash (PKH) verification
- Owner-only actions protected
- Prevents unauthorized modifications

✅ **State Management**
- Campaign status enforcement
- Prevents claims on paused/cancelled campaigns
- Datum validation on every transaction

✅ **Balance Protection**
- Pool amount tracking
- Prevents over-distribution
- Claims limited to available balance

✅ **Input Validation**
- All inputs validated on-chain
- Type safety via Aiken
- Prevents malformed data

✅ **No Reentrancy**
- Plutus model prevents reentrancy attacks
- UTXO-based architecture inherently safe

### Architecture Decisions

**Why Merkle Trees?**
- Efficient proof size: O(log n) vs O(n)
- Scalable to thousands of participants
- Verifiable without revealing full list
- Industry standard for airdrops

**Why Off-Chain Tree Generation?**
- Reduces on-chain computation costs
- Allows flexible distribution logic
- Enables auditable computation
- Trade-off: Requires trusted tree generation

**Why Owner Controls?**
- Flexibility for campaign management
- Emergency pause capability
- Enables error correction
- Trade-off: Requires trustworthy operators

## 🎯 Responsible Disclosure Policy

### Our Commitment

We are committed to working with security researchers:

- ✅ We will acknowledge your report within 24-48 hours
- ✅ We will keep you informed of our progress
- ✅ We will credit you in security advisories (if desired)
- ✅ We will not pursue legal action for good-faith research
- ✅ We may offer bounties for critical findings (see below)

### What We Expect

From security researchers:

- ⚠️ Report vulnerabilities privately first
- ⚠️ Allow reasonable time for fixes before public disclosure
- ⚠️ Do not exploit vulnerabilities on mainnet
- ⚠️ Do not access or modify other users' data
- ⚠️ Act in good faith

### Legal Safe Harbor

We support legal safe harbor for security researchers who:

- Make a good faith effort to avoid data loss or service disruption
- Do not violate privacy of users
- Do not use exploits for personal gain
- Follow this security policy

## 💰 Bug Bounty Program

### Bounty Scope

We offer rewards for qualifying security vulnerabilities:

| Severity | Bounty Range | Requirements |
|----------|--------------|--------------|
| **Critical** | $500 - $2,000 | Mainnet-affecting, high impact |
| **High** | $200 - $500 | Significant impact, exploitable |
| **Medium** | $50 - $200 | Limited impact, specific conditions |
| **Low** | Recognition | Informational, best practices |

**Note**: Bounties are awarded at our discretion based on:
- Impact and severity
- Quality of report
- Suggested fixes
- Mainnet vs testnet findings

### Out of Scope

The following are **not eligible** for bounties:

- Issues in dependencies (report to upstream)
- Known issues listed in this document
- Issues found on unofficial deployments
- Social engineering attacks
- Physical attacks
- Denial of service attacks
- Issues requiring physical access to user devices
- Issues already reported by someone else

## 📚 Security Resources

### Learn About Cardano Security

- [Cardano Security Best Practices](https://developers.cardano.org/docs/get-started/secure-coding/)
- [Plutus Security](https://plutus.readthedocs.io/en/latest/reference/security.html)
- [Aiken Security Guide](https://aiken-lang.org/security)

### Audit Tools

We recommend using these tools for auditing:

- **Aiken Compiler** - Built-in safety checks
- **Plutus Analyzer** - Static analysis
- **Cardano-CLI** - Manual transaction inspection
- **MeshSDK** - Transaction verification

### Testing Resources

- [Test Suite](./scripts/test-full-lifecycle.ts) - Comprehensive tests
- [On-chain Tests](./scripts/onchain-test-suite.sh) - Live network tests
- [Merkle Verification](./src/offchain/merkle-tree.ts) - Proof verification

## 📞 Contact

### Security Team

- **Primary Contact**: danamphred@gmail.com
- **Response Time**: 24-48 hours
- **Encryption**: PGP key available on request

### Emergency Contact

For critical vulnerabilities requiring immediate attention:
- **Email**: danamphred@gmail.com with subject `[CRITICAL SECURITY]`

### Public Discussions

For general security discussions (non-sensitive):
- [GitHub Discussions](https://github.com/task2earn/smartcontract/discussions)
- Tag discussions with `security`

## 📝 Security Changelog

### Version 1.0.0 (Current)

**Security Features:**
- ✅ Merkle proof verification implemented
- ✅ Owner authentication via PKH
- ✅ Campaign status enforcement
- ✅ Balance protection mechanisms
- ✅ Comprehensive test suite

**Known Limitations:**
- ⚠️ Awaiting professional audit
- ⚠️ Testnet only (no mainnet deployment)
- ⚠️ Off-chain Merkle generation

## 🔄 Future Security Enhancements

**Planned Improvements:**
- [ ] Professional third-party security audit
- [ ] Formal verification of core logic
- [ ] Multi-signature owner controls
- [ ] Time-locked claims
- [ ] Automated security scanning in CI/CD
- [ ] Bug bounty platform integration

## 📖 Acknowledgments

We thank the following for their contributions to our security:

- *Security researchers will be listed here upon request*
- Cardano security community
- Aiken language team
- MeshSDK contributors

---

**Thank you for helping keep Task2Earn and our users safe!** 🛡️

*Last Updated: November 2025*  
*Version: 1.0*

