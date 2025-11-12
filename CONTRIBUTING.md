# Contributing to Task2Earn Smart Contract

First off, thank you for considering contributing to the Task2Earn Smart Contract! 🎉

This document provides guidelines for contributing to this project. Following these guidelines helps maintain code quality and makes the contribution process smooth for everyone involved.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Security Vulnerabilities](#security-vulnerabilities)

## 📜 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Aiken** compiler (latest version)
- **Cardano Node** (for on-chain testing)
- **Git** for version control
- A **testnet wallet** with tADA (for testing)

### Setup Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/task2earn-smartcontract.git
   cd task2earn-smartcontract
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   ```bash
   export TARGET_DIR="$HOME/cardano-testnet"
   export SOCKET_PATH="$TARGET_DIR/db/node.socket"
   export TESTNET_MAGIC=1
   ```

5. **Verify setup**:
   ```bash
   ./scripts/check-setup.sh
   ```

6. **Run tests** to ensure everything works:
   ```bash
   npm test
   npx tsx scripts/test-full-lifecycle.ts
   ```

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug reports** - Found a bug? Open an issue!
- 💡 **Feature requests** - Have an idea? We'd love to hear it!
- 📝 **Documentation** - Help improve our docs
- 🧪 **Tests** - Add test coverage
- 🔧 **Code improvements** - Optimize existing code
- 🔒 **Security audits** - Review the contract for vulnerabilities
- 🎨 **UI/UX** - Improve developer experience

### Reporting Bugs

**Before submitting a bug report:**
- Check the [existing issues](https://github.com/task2earn/smartcontract/issues) to avoid duplicates
- Update to the latest version to see if the bug persists

**When submitting a bug report, include:**
- Clear and descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Environment details (OS, Node version, Aiken version, network)
- Relevant logs and error messages
- Screenshots if applicable

### Suggesting Enhancements

**Before suggesting an enhancement:**
- Check if it's already been suggested
- Consider if it aligns with the project's goals

**When suggesting an enhancement, include:**
- Clear description of the proposed feature
- Use cases and benefits
- Potential implementation approach
- Any drawbacks or concerns

## 💻 Development Workflow

### Branching Strategy

We follow **Git Flow** branching model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `security/security-fix` - Security patches

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write clean, readable code** following our standards
2. **Add tests** for new functionality
3. **Update documentation** as needed
4. **Run the test suite** before committing
5. **Keep commits atomic** - one logical change per commit

## 📐 Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Use **meaningful variable names**
- Add **JSDoc comments** for public functions
- Prefer **const** over **let**, avoid **var**
- Use **async/await** over raw promises
- Handle **errors properly** - no silent failures

**Example:**

```typescript
/**
 * Generates a Merkle tree from participant list
 * @param participants - Array of addresses and amounts
 * @param campaignId - Unique campaign identifier
 * @returns MerkleTree instance
 */
export function generateMerkleTree(
  participants: Participant[],
  campaignId: string
): MerkleTree {
  // Implementation
}
```

### Aiken Smart Contract

- Follow **Aiken style guide**
- Use **descriptive validator names**
- Add **comments** for complex logic
- Keep **functions pure** when possible
- Validate **all inputs** rigorously
- Document **datum and redeemer** structures

**Example:**

```aiken
// Validate that claim amount matches Merkle proof
fn validate_claim(
  participant: ByteArray,
  amount: Int,
  proof: List<ByteArray>,
  root: ByteArray
) -> Bool {
  // Implementation with detailed comments
}
```

### Code Structure

- Keep **files focused** - one responsibility per file
- Organize **imports** logically (stdlib, external, internal)
- Use **barrel exports** (index.ts) for clean imports
- Avoid **circular dependencies**
- Keep **functions small** - under 50 lines when possible

## 🧪 Testing Requirements

### Test Coverage

All contributions must include appropriate tests:

- **Unit tests** for utility functions
- **Integration tests** for contract interactions
- **Off-chain tests** for Merkle tree logic
- **On-chain tests** for validator logic

### Running Tests

```bash
# Off-chain tests (fast, no node required)
npx tsx scripts/test-full-lifecycle.ts

# On-chain tests (requires running node)
./scripts/onchain-test-suite.sh

# Specific test
npx tsx scripts/test-merkle-proof.ts
```

### Writing Tests

```typescript
describe('MerkleTree', () => {
  it('should generate valid proof for participant', () => {
    // Arrange
    const participants = [...];
    const tree = new MerkleTree(participants, 'campaign-1');
    
    // Act
    const proof = tree.getProof(participants[0].address);
    
    // Assert
    expect(tree.verify(proof, participants[0].address)).toBe(true);
  });
});
```

### Test Quality

- Tests must be **deterministic** - same input = same output
- Use **descriptive test names** - explain what is being tested
- Follow **AAA pattern** - Arrange, Act, Assert
- Test **edge cases** and error conditions
- Avoid **flaky tests** - no random data, no timing dependencies

## 📝 Commit Guidelines

### Commit Message Format

We follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `test` - Adding or updating tests
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `style` - Code style changes (formatting)
- `chore` - Maintenance tasks
- `security` - Security fixes

**Examples:**

```bash
feat(merkle): add proof generation for multiple campaigns

Implements multi-campaign support in Merkle tree generator.
Each campaign maintains isolated proof generation.

Closes #42

---

fix(validator): prevent double-claim vulnerability

Added participant tracking in datum to prevent claiming
rewards multiple times.

BREAKING CHANGE: Datum structure updated with claimedParticipants field

---

docs(readme): update deployment instructions

Added clarity on environment variable setup for testnet deployment.

---

test(claim): add edge case for invalid proof

Tests rejection of manipulated Merkle proofs.
```

### Commit Best Practices

- Keep commits **atomic** - one logical change
- Write in **imperative mood** - "add feature" not "added feature"
- Limit **subject line to 72 characters**
- Provide **detailed body** for complex changes
- Reference **issue numbers** in footer

## 🔄 Pull Request Process

### Before Submitting

1. ✅ **Rebase** your branch on latest `develop`
2. ✅ **Run all tests** and ensure they pass
3. ✅ **Update documentation** if needed
4. ✅ **Run linter** and fix any issues
5. ✅ **Self-review** your code changes

### Submitting a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub against `develop` branch

3. **Fill out the PR template** completely:
   - Description of changes
   - Related issue numbers
   - Testing performed
   - Breaking changes (if any)
   - Screenshots (if UI changes)

4. **Address review feedback** promptly

### PR Title Format

Follow same format as commit messages:

```
feat(merkle): add multi-campaign support
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Related Issue
Closes #123

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing Performed
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] On-chain tests pass
- [ ] Manual testing on testnet

## Breaking Changes
None / List any breaking changes

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Commit messages follow guidelines
```

### Review Process

- PRs require **at least one approval** from maintainers
- Address **all review comments** or explain why not
- Keep PRs **focused** - one feature/fix per PR
- **Respond to feedback** within 7 days or PR may be closed
- Be **respectful** and constructive in discussions

### After Approval

Once approved and CI passes:
- Maintainers will **merge** your PR
- Your branch will be **deleted** automatically
- You'll be added to **contributors** list! 🎉

## 🔒 Security Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead, please report security issues to:
- **Email**: danamphred@gmail.com (encrypted preferred)
- **Subject**: [SECURITY] Task2Earn Smart Contract Vulnerability

See [SECURITY.md](SECURITY.md) for detailed reporting guidelines.

## 📚 Additional Resources

- [Aiken Documentation](https://aiken-lang.org/docs)
- [Cardano Developer Portal](https://developers.cardano.org/)
- [Plutus Documentation](https://plutus.readthedocs.io/)
- [MeshSDK Documentation](https://meshjs.dev/)

## 🎯 Good First Issues

New to the project? Look for issues labeled:
- `good first issue` - Easy entry points
- `help wanted` - We need your expertise
- `documentation` - Improve our docs

## 💬 Questions?

- Open a [Discussion](https://github.com/task2earn/smartcontract/discussions) on GitHub
- Join our community chat
- Check existing [Issues](https://github.com/task2earn/smartcontract/issues)

## 🙏 Recognition

Contributors will be:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Credited in release notes
- Recognized in project documentation

---

**Thank you for contributing to Task2Earn! Your efforts help make decentralized task rewards accessible to everyone.** 🚀

*Last updated: November 2025*

