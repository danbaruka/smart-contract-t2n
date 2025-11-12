"use strict";
/**
 * Merkle Tree Verification (On-chain logic placeholder)
 * This would be implemented in the actual Plutus validator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMerkleProof = verifyMerkleProof;
function verifyMerkleProof(leafHash, proof, expectedRoot) {
    // This is a TypeScript implementation for reference
    // The actual on-chain verification happens in Plutus
    let current = leafHash;
    for (const proofElement of proof) {
        // Concatenate and hash in sorted order
        if (compareBytes(current, proofElement) <= 0) {
            current = hashConcat(current, proofElement);
        }
        else {
            current = hashConcat(proofElement, current);
        }
    }
    return compareBytes(current, expectedRoot) === 0;
}
function hashConcat(a, b) {
    const combined = new Uint8Array(a.length + b.length);
    combined.set(a, 0);
    combined.set(b, a.length);
    // This would use blake2b-256 in actual implementation
    return combined; // Placeholder
}
function compareBytes(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] < b[i])
            return -1;
        if (a[i] > b[i])
            return 1;
    }
    return a.length - b.length;
}
//# sourceMappingURL=merkle.js.map