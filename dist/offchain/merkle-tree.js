"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerkleTree = void 0;
exports.generateDistribution = generateDistribution;
const blake2b_1 = require("@noble/hashes/blake2b");
const utils_1 = require("@noble/hashes/utils");
class MerkleTree {
    leaves;
    layers;
    root;
    constructor(participants, campaignId) {
        // Sort participants by address for deterministic tree construction
        const sorted = [...participants].sort((a, b) => a.address.localeCompare(b.address));
        // Create leaf hashes
        this.leaves = sorted.map((participant, index) => ({
            address: participant.address,
            amount: participant.amount,
            hash: this.computeLeafHash(participant.address, participant.amount, campaignId),
            index
        }));
        // Build tree layers
        this.layers = this.buildTree(this.leaves.map(leaf => leaf.hash));
        this.root = this.layers[this.layers.length - 1][0];
    }
    /**
     * Get Merkle root hash
     */
    getRoot() {
        return this.root;
    }
    /**
     * Get Merkle root as hex string
     */
    getRootHex() {
        return (0, utils_1.bytesToHex)(this.root);
    }
    /**
     * Generate Merkle proof for specific participant
     */
    getProof(address) {
        const leaf = this.leaves.find(l => l.address === address);
        if (!leaf)
            return null;
        const proof = [];
        let index = leaf.index;
        // Traverse from leaf to root, collecting sibling hashes
        for (let level = 0; level < this.layers.length - 1; level++) {
            const layer = this.layers[level];
            const isRightNode = index % 2 === 1;
            const siblingIndex = isRightNode ? index - 1 : index + 1;
            if (siblingIndex < layer.length) {
                proof.push(layer[siblingIndex]);
            }
            else {
                // Odd number of nodes: sibling is self (duplicated)
                proof.push(layer[index]);
            }
            index = Math.floor(index / 2);
        }
        return proof;
    }
    /**
     * Verify a Merkle proof
     */
    verify(address, amount, campaignId, proof) {
        const leafHash = this.computeLeafHash(address, amount, campaignId);
        const reconstructed = this.reconstructRoot(leafHash, proof);
        // Check if reconstructed root matches stored root (equality check)
        return this.hashesEqual(reconstructed, this.root);
    }
    /**
     * Get all leaves with their proofs
     */
    getAllProofs() {
        const proofs = new Map();
        for (const leaf of this.leaves) {
            const proof = this.getProof(leaf.address);
            if (proof) {
                proofs.set(leaf.address, {
                    amount: leaf.amount,
                    proof,
                    proofHex: proof.map(p => (0, utils_1.bytesToHex)(p))
                });
            }
        }
        return proofs;
    }
    /**
     * Export tree to JSON for storage/distribution
     */
    toJSON() {
        return {
            root: (0, utils_1.bytesToHex)(this.root),
            leaves: this.leaves.map(leaf => ({
                address: leaf.address,
                amount: leaf.amount.toString(),
                hash: (0, utils_1.bytesToHex)(leaf.hash),
                index: leaf.index
            })),
            layers: this.layers.map(layer => layer.map(hash => (0, utils_1.bytesToHex)(hash)))
        };
    }
    // Private helper methods
    /**
     * Compute leaf hash: blake2b_256(address || amount || campaign_id)
     */
    computeLeafHash(address, amount, campaignId) {
        // Convert address to bytes (simplified - should use proper Cardano serialization)
        const addressBytes = new TextEncoder().encode(address);
        // Convert amount to bytes (8-byte big-endian for consistent serialization)
        const amountBytes = new Uint8Array(8);
        const amountView = new DataView(amountBytes.buffer);
        amountView.setBigUint64(0, amount, false); // Big-endian (network byte order)
        // Convert campaign ID to bytes
        const campaignBytes = new TextEncoder().encode(campaignId);
        // Concatenate all components: address || amount || campaignId
        const combined = new Uint8Array(addressBytes.length + amountBytes.length + campaignBytes.length);
        combined.set(addressBytes, 0);
        combined.set(amountBytes, addressBytes.length);
        combined.set(campaignBytes, addressBytes.length + amountBytes.length);
        // Hash with Blake2b-256 (same as Cardano uses)
        return (0, blake2b_1.blake2b)(combined, { dkLen: 32 });
    }
    /**
     * Build complete Merkle tree from leaf hashes
     */
    buildTree(leaves) {
        if (leaves.length === 0) {
            throw new Error("Cannot build tree with no leaves");
        }
        const layers = [leaves];
        while (layers[layers.length - 1].length > 1) {
            const currentLayer = layers[layers.length - 1];
            const nextLayer = [];
            for (let i = 0; i < currentLayer.length; i += 2) {
                const left = currentLayer[i];
                const right = i + 1 < currentLayer.length
                    ? currentLayer[i + 1]
                    : left; // Duplicate if odd number
                nextLayer.push(this.hashPair(left, right));
            }
            layers.push(nextLayer);
        }
        return layers;
    }
    /**
     * Hash two nodes together (with lexicographic ordering)
     */
    hashPair(a, b) {
        // Sort lexicographically for deterministic ordering
        const [first, second] = this.compareHashes(a, b) ? [a, b] : [b, a];
        const combined = new Uint8Array(first.length + second.length);
        combined.set(first, 0);
        combined.set(second, first.length);
        return (0, blake2b_1.blake2b)(combined, { dkLen: 32 });
    }
    /**
     * Reconstruct root from leaf and proof
     */
    reconstructRoot(leafHash, proof) {
        let current = leafHash;
        for (const proofElement of proof) {
            current = this.hashPair(current, proofElement);
        }
        return current;
    }
    /**
     * Compare two hashes (returns true if a <= b lexicographically)
     * Used for sorting during tree construction
     */
    compareHashes(a, b) {
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] < b[i])
                return true;
            if (a[i] > b[i])
                return false;
        }
        return a.length <= b.length;
    }
    /**
     * Check if two hashes are equal
     * Used for proof verification
     */
    hashesEqual(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
}
exports.MerkleTree = MerkleTree;
/**
 * Helper function to create and distribute Merkle tree
 */
function generateDistribution(participants, campaignId) {
    const tree = new MerkleTree(participants, campaignId);
    return {
        tree,
        root: tree.getRootHex(),
        proofs: tree.getAllProofs()
    };
}
//# sourceMappingURL=merkle-tree.js.map