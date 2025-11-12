"use strict";
/**
 * Transaction Builder for Task2Earn Campaign Operations
 * Simplified implementation for TypeScript
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignTxBuilder = void 0;
class CampaignTxBuilder {
    scriptAddress;
    compiledScript;
    constructor(scriptAddress, compiledScript) {
        this.scriptAddress = scriptAddress;
        this.compiledScript = compiledScript;
    }
    /**
     * Build transaction data for deposit
     */
    buildDepositTx(config) {
        const datum = this.buildInitialDatum(config);
        return {
            type: "Deposit",
            datum,
            outputs: [
                {
                    address: this.scriptAddress,
                    value: config.poolAmount,
                    datum
                }
            ]
        };
    }
    /**
     * Build transaction data for SetRoot
     */
    buildSetRootTx(campaignDatum, merkleRoot) {
        const newDatum = {
            ...campaignDatum,
            merkle_root: merkleRoot,
            status: "Ended"
        };
        return {
            type: "SetRoot",
            redeemer: { type: "SetRoot", new_root: merkleRoot },
            newDatum
        };
    }
    /**
     * Build transaction data for Claim
     */
    buildClaimTx(campaignDatum, participantAddress, rewardAmount, merkleProof) {
        const newDatum = {
            ...campaignDatum,
            pool_amount: campaignDatum.pool_amount - rewardAmount,
            total_claimed: campaignDatum.total_claimed + rewardAmount,
            claims_count: campaignDatum.claims_count + 1n
        };
        return {
            type: "Claim",
            redeemer: {
                type: "Claim",
                claim_data: {
                    participant_address: participantAddress,
                    reward_amount: rewardAmount,
                    merkle_proof: merkleProof
                }
            },
            newDatum,
            outputs: [
                {
                    address: this.scriptAddress,
                    value: newDatum.pool_amount,
                    datum: newDatum
                },
                {
                    address: participantAddress,
                    value: rewardAmount
                }
            ]
        };
    }
    /**
     * Build initial campaign datum
     */
    buildInitialDatum(config) {
        return {
            owner: config.owner,
            asset_class: {
                policy_id: config.assetPolicyId,
                asset_name: config.assetName
            },
            pool_amount: config.poolAmount,
            fee_wallet: config.feeWallet,
            platform_fee_bps: config.platformFeeBps,
            distribution_policy: config.distributionPolicy,
            status: "Active",
            mode: config.completionMode,
            cancel_policy: {
                allowed_before_claims: true,
                allowed_after_claims: false,
                penalty_bps: config.cancelPolicyPenaltyBps
            },
            merkle_root: new Uint8Array(0),
            api_credit: 0n,
            api_fee_per_check: 0n,
            api_used: 0n,
            total_claimed: 0n,
            claims_count: 0n,
            campaign_id: config.campaignId,
            participants_hash: new Uint8Array(0),
            token_metadata_hash: new Uint8Array(0)
        };
    }
}
exports.CampaignTxBuilder = CampaignTxBuilder;
//# sourceMappingURL=tx-builder.js.map