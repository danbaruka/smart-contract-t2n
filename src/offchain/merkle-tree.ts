import { blake2b } from "@noble/hashes/blake2b";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

/**
 * Off-chain Merkle Tree Implementation
 * 
 * Constructs Merkle trees for reward distribution and generates proofs
 * for individual participants to claim their rewards on-chain
 */

export interface ParticipantClaim {
    address: string;
    amount: bigint;
}

export interface MerkleLeaf {
    address: string;
    amount: bigint;
    hash: Uint8Array;
    index: number;
}

export class MerkleTree {
    private leaves: MerkleLeaf[];
    private layers: Uint8Array[][];
    private root: Uint8Array;

    constructor(participants: ParticipantClaim[], campaignId: string) {
        // Sort participants by address for deterministic tree construction
        const sorted = [...participants].sort((a, b) =>
            a.address.localeCompare(b.address)
        );

        // Create leaf hashes
        this.leaves = sorted.map((participant, index) => ({
            address: participant.address,
            amount: participant.amount,
            hash: this.computeLeafHash(
                participant.address,
                participant.amount,
                campaignId
            ),
            index
        }));

        // Build tree layers
        this.layers = this.buildTree(this.leaves.map(leaf => leaf.hash));
        this.root = this.layers[this.layers.length - 1][0];
    }

    /**
     * Get Merkle root hash
     */
    getRoot(): Uint8Array {
        return this.root;
    }

    /**
     * Get Merkle root as hex string
     */
    getRootHex(): string {
        return bytesToHex(this.root);
    }

    /**
     * Generate Merkle proof for specific participant
     */
    getProof(address: string): Uint8Array[] | null {
        const leaf = this.leaves.find(l => l.address === address);
        if (!leaf) return null;

        const proof: Uint8Array[] = [];
        let index = leaf.index;

        // Traverse from leaf to root, collecting sibling hashes
        for (let level = 0; level < this.layers.length - 1; level++) {
            const layer = this.layers[level];
            const isRightNode = index % 2 === 1;
            const siblingIndex = isRightNode ? index - 1 : index + 1;

            if (siblingIndex < layer.length) {
                proof.push(layer[siblingIndex]);
            } else {
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
    verify(
        address: string,
        amount: bigint,
        campaignId: string,
        proof: Uint8Array[]
    ): boolean {
        const leafHash = this.computeLeafHash(address, amount, campaignId);
        const reconstructed = this.reconstructRoot(leafHash, proof);

        // Check if reconstructed root matches stored root (equality check)
        return this.hashesEqual(reconstructed, this.root);
    }

    /**
     * Get all leaves with their proofs
     */
    getAllProofs(): Map<string, {
        amount: bigint;
        proof: Uint8Array[];
        proofHex: string[];
    }> {
        const proofs = new Map();

        for (const leaf of this.leaves) {
            const proof = this.getProof(leaf.address);
            if (proof) {
                proofs.set(leaf.address, {
                    amount: leaf.amount,
                    proof,
                    proofHex: proof.map(p => bytesToHex(p))
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
            root: bytesToHex(this.root),
            leaves: this.leaves.map(leaf => ({
                address: leaf.address,
                amount: leaf.amount.toString(),
                hash: bytesToHex(leaf.hash),
                index: leaf.index
            })),
            layers: this.layers.map(layer =>
                layer.map(hash => bytesToHex(hash))
            )
        };
    }

    // Private helper methods

    /**
     * Compute leaf hash: blake2b_256(address || amount || campaign_id)
     */
    private computeLeafHash(
        address: string,
        amount: bigint,
        campaignId: string
    ): Uint8Array {
        // Convert address to bytes (simplified - should use proper Cardano serialization)
        const addressBytes = new TextEncoder().encode(address);

        // Convert amount to bytes (8-byte big-endian for consistent serialization)
        const amountBytes = new Uint8Array(8);
        const amountView = new DataView(amountBytes.buffer);
        amountView.setBigUint64(0, amount, false); // Big-endian (network byte order)

        // Convert campaign ID to bytes
        const campaignBytes = new TextEncoder().encode(campaignId);

        // Concatenate all components: address || amount || campaignId
        const combined = new Uint8Array(
            addressBytes.length + amountBytes.length + campaignBytes.length
        );
        combined.set(addressBytes, 0);
        combined.set(amountBytes, addressBytes.length);
        combined.set(campaignBytes, addressBytes.length + amountBytes.length);

        // Hash with Blake2b-256 (same as Cardano uses)
        return blake2b(combined, { dkLen: 32 });
    }

    /**
     * Build complete Merkle tree from leaf hashes
     */
    private buildTree(leaves: Uint8Array[]): Uint8Array[][] {
        if (leaves.length === 0) {
            throw new Error("Cannot build tree with no leaves");
        }

        const layers: Uint8Array[][] = [leaves];

        while (layers[layers.length - 1].length > 1) {
            const currentLayer = layers[layers.length - 1];
            const nextLayer: Uint8Array[] = [];

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
    private hashPair(a: Uint8Array, b: Uint8Array): Uint8Array {
        // Sort lexicographically for deterministic ordering
        const [first, second] = this.compareHashes(a, b) ? [a, b] : [b, a];

        const combined = new Uint8Array(first.length + second.length);
        combined.set(first, 0);
        combined.set(second, first.length);

        return blake2b(combined, { dkLen: 32 });
    }

    /**
     * Reconstruct root from leaf and proof
     */
    private reconstructRoot(leafHash: Uint8Array, proof: Uint8Array[]): Uint8Array {
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
    private compareHashes(a: Uint8Array, b: Uint8Array): boolean {
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] < b[i]) return true;
            if (a[i] > b[i]) return false;
        }
        return a.length <= b.length;
    }

    /**
     * Check if two hashes are equal
     * Used for proof verification
     */
    private hashesEqual(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}

/**
 * Helper function to create and distribute Merkle tree
 */
export function generateDistribution(
    participants: ParticipantClaim[],
    campaignId: string
): {
    tree: MerkleTree;
    root: string;
    proofs: Map<string, { amount: bigint; proof: Uint8Array[]; proofHex: string[] }>;
} {
    const tree = new MerkleTree(participants, campaignId);

    return {
        tree,
        root: tree.getRootHex(),
        proofs: tree.getAllProofs()
    };
}

