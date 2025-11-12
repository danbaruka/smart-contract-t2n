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
export declare class MerkleTree {
    private leaves;
    private layers;
    private root;
    constructor(participants: ParticipantClaim[], campaignId: string);
    /**
     * Get Merkle root hash
     */
    getRoot(): Uint8Array;
    /**
     * Get Merkle root as hex string
     */
    getRootHex(): string;
    /**
     * Generate Merkle proof for specific participant
     */
    getProof(address: string): Uint8Array[] | null;
    /**
     * Verify a Merkle proof
     */
    verify(address: string, amount: bigint, campaignId: string, proof: Uint8Array[]): boolean;
    /**
     * Get all leaves with their proofs
     */
    getAllProofs(): Map<string, {
        amount: bigint;
        proof: Uint8Array[];
        proofHex: string[];
    }>;
    /**
     * Export tree to JSON for storage/distribution
     */
    toJSON(): {
        root: string;
        leaves: {
            address: string;
            amount: string;
            hash: string;
            index: number;
        }[];
        layers: string[][];
    };
    /**
     * Compute leaf hash: blake2b_256(address || amount || campaign_id)
     */
    private computeLeafHash;
    /**
     * Build complete Merkle tree from leaf hashes
     */
    private buildTree;
    /**
     * Hash two nodes together (with lexicographic ordering)
     */
    private hashPair;
    /**
     * Reconstruct root from leaf and proof
     */
    private reconstructRoot;
    /**
     * Compare two hashes (returns true if a <= b lexicographically)
     * Used for sorting during tree construction
     */
    private compareHashes;
    /**
     * Check if two hashes are equal
     * Used for proof verification
     */
    private hashesEqual;
}
/**
 * Helper function to create and distribute Merkle tree
 */
export declare function generateDistribution(participants: ParticipantClaim[], campaignId: string): {
    tree: MerkleTree;
    root: string;
    proofs: Map<string, {
        amount: bigint;
        proof: Uint8Array[];
        proofHex: string[];
    }>;
};
//# sourceMappingURL=merkle-tree.d.ts.map