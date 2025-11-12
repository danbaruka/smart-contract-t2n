/**
 * Transaction Builder for Task2Earn Campaign Operations
 * Simplified implementation for TypeScript
 */

import { CampaignDatum } from "../types/datum";

export interface CampaignConfig {
    owner: string;
    assetPolicyId: string;
    assetName: string;
    poolAmount: bigint;
    feeWallet: string;
    platformFeeBps: number;
    distributionPolicy: "PullMerkle" | "PushBatched" | "Streamed";
    completionMode: {
        type: "ByTime" | "ByBudget" | "ByParticipants" | "ByManual" | "ByFirstClaim";
        value?: bigint;
    };
    cancelPolicyPenaltyBps: number;
    campaignId: string;
}

export class CampaignTxBuilder {
    private scriptAddress: string;
    private compiledScript: any;

    constructor(scriptAddress: string, compiledScript: any) {
        this.scriptAddress = scriptAddress;
        this.compiledScript = compiledScript;
    }

    /**
     * Build transaction data for deposit
     */
    buildDepositTx(config: CampaignConfig): {
        type: "Deposit";
        datum: CampaignDatum;
        outputs: any[];
    } {
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
    buildSetRootTx(
        campaignDatum: CampaignDatum,
        merkleRoot: Uint8Array
    ): {
        type: "SetRoot";
        redeemer: { type: "SetRoot"; new_root: Uint8Array };
        newDatum: CampaignDatum;
    } {
        const newDatum = {
            ...campaignDatum,
            merkle_root: merkleRoot,
            status: "Ended" as const
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
    buildClaimTx(
        campaignDatum: CampaignDatum,
        participantAddress: string,
        rewardAmount: bigint,
        merkleProof: Uint8Array[]
    ): {
        type: "Claim";
        redeemer: any;
        newDatum: CampaignDatum;
        outputs: any[];
    } {
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
    private buildInitialDatum(config: CampaignConfig): CampaignDatum {
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
