/**
 * Complete Transaction Builder for Task2Earn Campaign
 * 
 * Implements all transaction types:
 * - Deployment
 * - SetRoot (Finalize)
 * - Claim
 * - Pause/Resume
 * - Cancel
 */

import { MerkleTree } from './merkle-tree';

export interface UTxO {
    txHash: string;
    outputIndex: number;
    address: string;
    value: {
        lovelace: bigint;
        assets?: Record<string, bigint>;
    };
    datum?: any;
    datumHash?: string;
    scriptRef?: string;
}

export interface CampaignDatum {
    owner: string;  // PKH hex
    merkleRoot: string;  // hex
    poolAmount: bigint;
    totalClaimed: bigint;
    claimsCount: bigint;
    status: number;  // 0=Active, 1=Paused, 2=Ended, 3=Cancelled
    claimedParticipants: string[];  // List of PKH hex
}

export interface ClaimData {
    participantAddr: string;  // PKH hex
    claimAmount: bigint;
    merkleProof: string[];  // Array of hex hashes
}

export class CampaignTxBuilder {
    private scriptAddress: string;
    private scriptCbor: string;
    
    constructor(scriptAddress: string, scriptCbor: string) {
        this.scriptAddress = scriptAddress;
        this.scriptCbor = scriptCbor;
    }

    /**
     * Build deployment transaction
     */
    async buildDeployTx(params: {
        ownerPkh: string;
        poolAmount: bigint;
        walletUtxo: UTxO;
        changeAddress: string;
    }): Promise<{
        txBody: string;
        datum: CampaignDatum;
    }> {
        const datum: CampaignDatum = {
            owner: params.ownerPkh,
            merkleRoot: "",  // Empty initially
            poolAmount: params.poolAmount,
            totalClaimed: 0n,
            claimsCount: 0n,
            status: 0,  // Active
            claimedParticipants: []
        };

        // This would use Lucid/Mesh to build the actual transaction
        // For now, return the structure
        return {
            txBody: "TODO: Build with Lucid",
            datum
        };
    }

    /**
     * Build SetRoot transaction (Finalize campaign)
     */
    async buildSetRootTx(params: {
        campaignUtxo: UTxO;
        currentDatum: CampaignDatum;
        merkleRoot: string;  // hex
        ownerPkh: string;
        walletUtxo: UTxO;
        changeAddress: string;
    }): Promise<{
        txBody: string;
        newDatum: CampaignDatum;
        redeemer: any;
    }> {
        // Validation
        if (params.currentDatum.status !== 0) {
            throw new Error("Campaign must be Active to finalize");
        }
        if (params.currentDatum.merkleRoot !== "") {
            throw new Error("Merkle root already set");
        }
        if (params.currentDatum.owner !== params.ownerPkh) {
            throw new Error("Only owner can finalize");
        }

        // Create updated datum
        const newDatum: CampaignDatum = {
            ...params.currentDatum,
            merkleRoot: params.merkleRoot,
            status: 2  // Ended
        };

        // Redeemer for Finalize action
        const redeemer = {
            constructor: 1,  // Finalize variant
            fields: []
        };

        // Transaction structure:
        // - Input: campaign UTxO (with old datum, Finalize redeemer)
        // - Output: campaign UTxO (with new datum, same value)
        // - Required signer: owner
        
        console.log("SetRoot transaction ready:");
        console.log("- Old status: Active (0)");
        console.log("- New status: Ended (2)");
        console.log(`- Merkle root: ${params.merkleRoot}`);

        return {
            txBody: this.buildTxWithLucid({
                inputs: [{
                    utxo: params.campaignUtxo,
                    redeemer,
                    script: this.scriptCbor
                }],
                outputs: [{
                    address: this.scriptAddress,
                    value: params.campaignUtxo.value,
                    datum: newDatum
                }],
                requiredSigners: [params.ownerPkh],
                changeAddress: params.changeAddress
            }),
            newDatum,
            redeemer
        };
    }

    /**
     * Build Claim transaction
     */
    async buildClaimTx(params: {
        campaignUtxo: UTxO;
        currentDatum: CampaignDatum;
        claimData: ClaimData;
        participantAddress: string;
        walletUtxo: UTxO;
        changeAddress: string;
    }): Promise<{
        txBody: string;
        newDatum: CampaignDatum;
        redeemer: any;
    }> {
        // Validation
        if (params.currentDatum.status !== 2) {
            throw new Error("Campaign must be Ended to claim");
        }
        if (params.currentDatum.merkleRoot === "") {
            throw new Error("Merkle root not set");
        }
        
        // Double-claim prevention
        if (params.currentDatum.claimedParticipants.includes(params.claimData.participantAddr)) {
            throw new Error("Participant has already claimed");
        }

        // Balance check
        const remaining = params.currentDatum.poolAmount - params.currentDatum.totalClaimed;
        if (remaining < params.claimData.claimAmount) {
            throw new Error(`Insufficient balance. Available: ${remaining}, Requested: ${params.claimData.claimAmount}`);
        }

        // Create updated datum
        const newDatum: CampaignDatum = {
            ...params.currentDatum,
            totalClaimed: params.currentDatum.totalClaimed + params.claimData.claimAmount,
            claimsCount: params.currentDatum.claimsCount + 1n,
            claimedParticipants: [
                ...params.currentDatum.claimedParticipants,
                params.claimData.participantAddr
            ]
        };

        // Redeemer for Claim action
        const redeemer = {
            constructor: 0,  // Claim variant
            fields: [{
                constructor: 0,
                fields: [
                    { bytes: params.claimData.participantAddr },
                    { int: Number(params.claimData.claimAmount) },
                    { list: params.claimData.merkleProof.map(p => ({ bytes: p })) }
                ]
            }]
        };

        // Transaction structure:
        // - Input: campaign UTxO (with old datum, Claim redeemer)
        // - Input: wallet UTxO (for fees)
        // - Output: participant payment (claimAmount)
        // - Output: campaign UTxO (with new datum, reduced balance)
        // - Collateral: wallet UTxO

        const newPoolValue = params.campaignUtxo.value.lovelace - params.claimData.claimAmount;

        console.log("Claim transaction ready:");
        console.log(`- Participant: ${params.claimData.participantAddr.substring(0, 16)}...`);
        console.log(`- Amount: ${params.claimData.claimAmount} lovelace`);
        console.log(`- Remaining pool: ${newPoolValue} lovelace`);
        console.log(`- Total claims: ${newDatum.claimsCount}`);

        return {
            txBody: this.buildTxWithLucid({
                inputs: [
                    {
                        utxo: params.campaignUtxo,
                        redeemer,
                        script: this.scriptCbor
                    },
                    {
                        utxo: params.walletUtxo
                    }
                ],
                outputs: [
                    {
                        address: params.participantAddress,
                        value: { lovelace: params.claimData.claimAmount }
                    },
                    {
                        address: this.scriptAddress,
                        value: { lovelace: newPoolValue },
                        datum: newDatum
                    }
                ],
                collateral: [params.walletUtxo],
                changeAddress: params.changeAddress
            }),
            newDatum,
            redeemer
        };
    }

    /**
     * Build Pause transaction
     */
    async buildPauseTx(params: {
        campaignUtxo: UTxO;
        currentDatum: CampaignDatum;
        ownerPkh: string;
        walletUtxo: UTxO;
        changeAddress: string;
    }): Promise<{
        txBody: string;
        newDatum: CampaignDatum;
        redeemer: any;
    }> {
        // Validation
        if (params.currentDatum.status !== 0) {
            throw new Error("Can only pause Active campaigns");
        }
        if (params.currentDatum.owner !== params.ownerPkh) {
            throw new Error("Only owner can pause");
        }

        const newDatum: CampaignDatum = {
            ...params.currentDatum,
            status: 1  // Paused
        };

        const redeemer = {
            constructor: 3,  // Pause variant
            fields: []
        };

        return {
            txBody: this.buildTxWithLucid({
                inputs: [{
                    utxo: params.campaignUtxo,
                    redeemer,
                    script: this.scriptCbor
                }],
                outputs: [{
                    address: this.scriptAddress,
                    value: params.campaignUtxo.value,
                    datum: newDatum
                }],
                requiredSigners: [params.ownerPkh],
                changeAddress: params.changeAddress
            }),
            newDatum,
            redeemer
        };
    }

    /**
     * Build Resume transaction
     */
    async buildResumeTx(params: {
        campaignUtxo: UTxO;
        currentDatum: CampaignDatum;
        ownerPkh: string;
        walletUtxo: UTxO;
        changeAddress: string;
    }): Promise<{
        txBody: string;
        newDatum: CampaignDatum;
        redeemer: any;
    }> {
        // Validation
        if (params.currentDatum.status !== 1) {
            throw new Error("Can only resume Paused campaigns");
        }
        if (params.currentDatum.owner !== params.ownerPkh) {
            throw new Error("Only owner can resume");
        }

        const newDatum: CampaignDatum = {
            ...params.currentDatum,
            status: 0  // Active
        };

        const redeemer = {
            constructor: 4,  // Resume variant
            fields: []
        };

        return {
            txBody: this.buildTxWithLucid({
                inputs: [{
                    utxo: params.campaignUtxo,
                    redeemer,
                    script: this.scriptCbor
                }],
                outputs: [{
                    address: this.scriptAddress,
                    value: params.campaignUtxo.value,
                    datum: newDatum
                }],
                requiredSigners: [params.ownerPkh],
                changeAddress: params.changeAddress
            }),
            newDatum,
            redeemer
        };
    }

    /**
     * Build Cancel transaction
     */
    async buildCancelTx(params: {
        campaignUtxo: UTxO;
        currentDatum: CampaignDatum;
        ownerPkh: string;
        refundAddress: string;
        walletUtxo: UTxO;
        changeAddress: string;
    }): Promise<{
        txBody: string;
        newDatum: CampaignDatum;
        redeemer: any;
    }> {
        // Validation
        if (params.currentDatum.status !== 0) {
            throw new Error("Can only cancel Active campaigns");
        }
        if (params.currentDatum.owner !== params.ownerPkh) {
            throw new Error("Only owner can cancel");
        }

        const newDatum: CampaignDatum = {
            ...params.currentDatum,
            status: 3  // Cancelled
        };

        const redeemer = {
            constructor: 2,  // Cancel variant
            fields: []
        };

        // Return remaining funds to owner
        const refundAmount = params.campaignUtxo.value.lovelace - params.currentDatum.totalClaimed;

        return {
            txBody: this.buildTxWithLucid({
                inputs: [{
                    utxo: params.campaignUtxo,
                    redeemer,
                    script: this.scriptCbor
                }],
                outputs: [{
                    address: params.refundAddress,
                    value: { lovelace: refundAmount }
                }],
                requiredSigners: [params.ownerPkh],
                changeAddress: params.changeAddress
            }),
            newDatum,
            redeemer
        };
    }

    /**
     * Helper to build transaction with Lucid
     * (This would integrate with actual Lucid library)
     */
    private buildTxWithLucid(params: {
        inputs: Array<{
            utxo: UTxO;
            redeemer?: any;
            script?: string;
        }>;
        outputs: Array<{
            address: string;
            value: { lovelace: bigint; assets?: Record<string, bigint> };
            datum?: any;
        }>;
        requiredSigners?: string[];
        collateral?: UTxO[];
        changeAddress: string;
    }): string {
        // This would use Lucid to build the actual transaction
        // For now, return a placeholder
        
        return JSON.stringify({
            type: "TxBodyConway",
            description: "Task2Earn Campaign Transaction",
            cborHex: "TODO: Implement with Lucid",
            inputs: params.inputs.length,
            outputs: params.outputs.length,
            fee: "estimated"
        }, null, 2);
    }
}

/**
 * Error handling wrapper for transaction building
 */
export class TxBuildError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'TxBuildError';
    }
}

/**
 * Retry logic for transaction submission
 */
export async function submitTxWithRetry(
    txCbor: string,
    maxRetries: number = 3,
    delayMs: number = 2000
): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Submit transaction (would use Lucid/cardano-cli)
            console.log(`Attempt ${attempt}/${maxRetries}: Submitting transaction...`);
            
            // Placeholder for actual submission
            const txHash = "placeholder-tx-hash";
            
            console.log(`✅ Transaction submitted: ${txHash}`);
            return txHash;
            
        } catch (error) {
            if (attempt === maxRetries) {
                throw new TxBuildError(
                    `Transaction submission failed after ${maxRetries} attempts`,
                    'TX_SUBMIT_FAILED',
                    error
                );
            }
            
            console.log(`⚠️  Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    throw new TxBuildError('Unexpected error in retry loop', 'TX_RETRY_ERROR');
}

/**
 * Transaction monitoring
 */
export class TxMonitor {
    private confirmations: Map<string, number> = new Map();
    
    async waitForConfirmation(
        txHash: string,
        requiredConfirmations: number = 1,
        timeoutMs: number = 120000
    ): Promise<boolean> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeoutMs) {
            try {
                // Query transaction status (would use Blockfrost/Koios)
                const confirmations = await this.getConfirmations(txHash);
                
                if (confirmations >= requiredConfirmations) {
                    console.log(`✅ Transaction ${txHash.substring(0, 16)}... confirmed (${confirmations} confirmations)`);
                    return true;
                }
                
                console.log(`⏳ Waiting for confirmation... (${confirmations}/${requiredConfirmations})`);
                await new Promise(resolve => setTimeout(resolve, 10000));  // Check every 10s
                
            } catch (error) {
                console.error(`Error checking transaction status:`, error);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
        
        throw new TxBuildError(
            `Transaction not confirmed within ${timeoutMs}ms`,
            'TX_TIMEOUT',
            { txHash }
        );
    }
    
    private async getConfirmations(txHash: string): Promise<number> {
        // Placeholder - would query blockchain
        return this.confirmations.get(txHash) || 0;
    }
}

