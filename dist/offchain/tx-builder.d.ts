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
export declare class CampaignTxBuilder {
    private scriptAddress;
    private compiledScript;
    constructor(scriptAddress: string, compiledScript: any);
    /**
     * Build transaction data for deposit
     */
    buildDepositTx(config: CampaignConfig): {
        type: "Deposit";
        datum: CampaignDatum;
        outputs: any[];
    };
    /**
     * Build transaction data for SetRoot
     */
    buildSetRootTx(campaignDatum: CampaignDatum, merkleRoot: Uint8Array): {
        type: "SetRoot";
        redeemer: {
            type: "SetRoot";
            new_root: Uint8Array;
        };
        newDatum: CampaignDatum;
    };
    /**
     * Build transaction data for Claim
     */
    buildClaimTx(campaignDatum: CampaignDatum, participantAddress: string, rewardAmount: bigint, merkleProof: Uint8Array[]): {
        type: "Claim";
        redeemer: any;
        newDatum: CampaignDatum;
        outputs: any[];
    };
    /**
     * Build initial campaign datum
     */
    private buildInitialDatum;
}
//# sourceMappingURL=tx-builder.d.ts.map