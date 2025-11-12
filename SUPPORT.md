# Support

Need help with the Task2Earn Smart Contract? You're in the right place!

## 📚 Documentation

Before asking for help, please check our documentation:

- **[README.md](./README.md)** - Project overview and quick start
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Backend integration
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute
- **[SECURITY.md](./SECURITY.md)** - Security and vulnerability reporting
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Documentation overview

## 🆘 Getting Help

### 1. Check Existing Resources

**Documentation**
- Read the [README.md](./README.md) carefully
- Check the [FAQ section](#faq) below
- Review example scripts in `scripts/` directory

**Issues & Discussions**
- Search [existing issues](https://github.com/task2earn/smartcontract/issues)
- Check [closed issues](https://github.com/task2earn/smartcontract/issues?q=is%3Aissue+is%3Aclosed)
- Browse [discussions](https://github.com/task2earn/smartcontract/discussions)

### 2. Ask the Community

**GitHub Discussions** (Recommended)

For general questions, ideas, and community support:
- [Open a discussion](https://github.com/task2earn/smartcontract/discussions)
- Tag appropriately: `question`, `help-wanted`, etc.
- Provide context and code examples

### 3. Report Issues

**Found a bug?**

Use our [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md):
- Describe the bug clearly
- Include steps to reproduce
- Share relevant logs and environment details
- Specify network (Preprod/Preview/Mainnet)

**Security vulnerability?**

⚠️ **DO NOT** create a public issue. See [SECURITY.md](./SECURITY.md) for responsible disclosure.

### 4. Request Features

Have an idea for improvement?

Use our [feature request template](./.github/ISSUE_TEMPLATE/feature_request.md):
- Describe the feature clearly
- Explain the use case and benefits
- Consider implementation ideas

### 5. Direct Contact

**Email Support**: danamphred@gmail.com

Use email for:
- Commercial licensing inquiries
- Private discussions
- Partnership opportunities
- Security vulnerabilities (use subject: `[SECURITY]`)

**Response Time**: 24-48 hours for emails

---

## 🔍 FAQ

### General Questions

**Q: What is Task2Earn Smart Contract?**

A: A Cardano Plutus V3 smart contract for distributing rewards to task participants using Merkle proof verification. It enables efficient, gas-optimized reward distribution with O(log n) verification.

**Q: What license is this under?**

A: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0). Free for non-commercial use (education, research, auditing). Commercial use requires licensing - contact danamphred@gmail.com.

**Q: Is this audited?**

A: Not yet. We're awaiting professional security audit. Community audits are welcome! We have a bug bounty program ($50-$2,000). See [SECURITY.md](./SECURITY.md).

**Q: Which networks are supported?**

A: Currently Cardano Preprod Testnet (testnet magic = 1). Mainnet support will come after professional audit.

### Technical Questions

**Q: How do I deploy the contract?**

A: See [README.md](./README.md) Quick Start section:
```bash
export TARGET_DIR="$HOME/cardano-testnet"
./scripts/deploy-preprod.sh
```

**Q: How do I generate Merkle proofs?**

A: Use our off-chain utilities:
```typescript
import { MerkleTree } from './src/offchain/merkle-tree';

const tree = new MerkleTree(participants, campaignId);
const proof = tree.getProof(participantAddress);
```

**Q: What are the transaction fees?**

A: On Preprod testnet:
- Deployment: ~172,541 lovelace
- Claim: ~168,625 lovelace
- Status changes: ~165,000-170,000 lovelace

**Q: How many participants can I have?**

A: Thousands! Merkle proofs scale at O(log n):
- 3 participants = 2 hashes
- 7 participants = 3 hashes
- 1,000 participants = ~10 hashes
- 1,000,000 participants = ~20 hashes

**Q: Can participants claim multiple times?**

A: No, the contract prevents double-claiming through participant tracking in the datum.

**Q: Can I cancel a campaign?**

A: Yes, the owner can cancel a campaign. Currently, this doesn't auto-distribute remaining funds - they remain locked in the contract for manual recovery.

### Development Questions

**Q: How do I run tests?**

A: We have two test suites:
```bash
# Off-chain tests (no node required)
npx tsx scripts/test-full-lifecycle.ts

# On-chain tests (requires running node)
./scripts/onchain-test-suite.sh
```

**Q: How do I contribute?**

A: See [CONTRIBUTING.md](./CONTRIBUTING.md):
1. Fork the repository
2. Make your changes
3. Add tests
4. Submit a PR using our template

**Q: What's the code structure?**

A:
```
smartcontract/
├── validators/          # Aiken smart contract
├── src/offchain/        # TypeScript utilities
├── scripts/             # Deployment & testing
└── docs/               # Documentation
```

**Q: Can I use this in production?**

A: Currently testnet only. Mainnet deployment requires:
- Professional security audit
- Additional testing
- Community review
- Explicit mainnet support release

### Integration Questions

**Q: How do I integrate with my backend?**

A: See detailed guide in [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md). Basic flow:
1. Generate Merkle tree from participant list
2. Deploy campaign with initial funds
3. Finalize campaign with Merkle root
4. Participants claim with proofs

**Q: What data do I need to store off-chain?**

A:
- Participant list (addresses + amounts)
- Merkle root
- Campaign ID
- Contract UTXO reference
- Transaction hashes for tracking

**Q: How do I verify claims?**

A: Use our verification utilities:
```typescript
const isValid = tree.verify(proof, participantAddress, amount);
```

**Q: Can I customize the datum structure?**

A: Not without modifying and redeploying the contract. The current datum structure is:
```typescript
{
  owner: ByteArray,
  merkleRoot: ByteArray,
  poolAmount: Int,
  totalClaimed: Int,
  claimsCount: Int,
  status: Int
}
```

### Troubleshooting

**Q: Getting "Node connection failed"**

A:
1. Check node is running: `./scripts/test-node.sh`
2. Verify SOCKET_PATH: `echo $SOCKET_PATH`
3. Ensure correct permissions on socket file
4. Confirm network is synced

**Q: Transaction fails with "Insufficient funds"**

A:
1. Check wallet balance
2. Ensure enough ADA for fees + min UTXO
3. Account for ~170,000 lovelace fees
4. Verify network (Preprod testnet = magic 1)

**Q: "Invalid proof" error**

A:
1. Verify Merkle tree includes the participant
2. Check campaign ID matches
3. Ensure amount matches exactly
4. Confirm participant address is correct
5. Verify Merkle root in datum

**Q: "Script execution failed"**

A:
1. Check contract is latest version
2. Verify datum structure
3. Ensure correct redeemer
4. Check authorization (owner signature)
5. Review logs for specific error

---

## 📖 Learning Resources

### Cardano Development

- [Cardano Developer Portal](https://developers.cardano.org/)
- [Plutus Documentation](https://plutus.readthedocs.io/)
- [Aiken Language Guide](https://aiken-lang.org/docs)
- [MeshSDK Documentation](https://meshjs.dev/)

### Smart Contract Security

- [Cardano Security Best Practices](https://developers.cardano.org/docs/get-started/secure-coding/)
- [Our Security Policy](./SECURITY.md)

### Merkle Trees

- [Wikipedia - Merkle Tree](https://en.wikipedia.org/wiki/Merkle_tree)
- [Ethereum's use of Merkle Trees](https://blog.ethereum.org/2015/11/15/merkling-in-ethereum)

---

## 💼 Commercial Support

For commercial support, custom development, or licensing:

**Contact**: danamphred@gmail.com  
**Subject**: `[COMMERCIAL] Your Topic`

We offer:
- Commercial licensing for production use
- Custom contract development
- Integration consulting
- Priority support
- Training and workshops
- Security auditing

---

## 🤝 Community Support

### Be a Good Community Member

When asking for help:
- ✅ Search existing resources first
- ✅ Provide clear description of your issue
- ✅ Include relevant code snippets
- ✅ Share error messages and logs
- ✅ Specify your environment (OS, versions, network)
- ✅ Be respectful and patient
- ❌ Don't post the same question multiple places
- ❌ Don't demand immediate responses
- ❌ Don't share private keys or sensitive data

### Help Others

You can help too!
- Answer questions in Discussions
- Review and test PRs
- Improve documentation
- Share your experiences
- Report bugs responsibly

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community standards.

---

## 📬 Support Channels Summary

| Channel | Use For | Response Time |
|---------|---------|---------------|
| [GitHub Issues](https://github.com/task2earn/smartcontract/issues) | Bug reports | 1-3 days |
| [GitHub Discussions](https://github.com/task2earn/smartcontract/discussions) | Questions, ideas | 1-2 days |
| Email (danamphred@gmail.com) | Private, commercial | 24-48 hours |
| [SECURITY.md](./SECURITY.md) | Security vulnerabilities | < 24 hours |

---

## 📊 Status Page

**Project Status**: ✅ Active Development

- **Latest Version**: 1.0.0
- **Network**: Cardano Preprod Testnet
- **Plutus Version**: V3 (Conway era)
- **Maintenance**: Actively maintained
- **Issue Response**: Within 1-3 days
- **PR Review**: Within 3-7 days

---

## 🙏 Thank You

Thank you for using Task2Earn Smart Contract! Your feedback helps us improve.

If you find this project helpful:
- ⭐ Star the repository
- 📢 Share with others
- 🤝 Contribute code or documentation
- 🐛 Report bugs
- 💡 Suggest features

---

*Last Updated: November 12, 2025*  
*For urgent issues, email: danamphred@gmail.com*

**We're here to help!** 🚀

