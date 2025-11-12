/**
 * Campaign Datum and Type Definitions
 * Simplified for Plu-ts compatibility
 */

export interface AssetClass {
    policy_id: string;
    asset_name: string;
}

export interface CancelPolicy {
    allowed_before_claims: boolean;
    allowed_after_claims: boolean;
    penalty_bps: number;
}

export interface CampaignDatum {
    owner: string;
    asset_class: AssetClass;
    pool_amount: bigint;
    fee_wallet: string;
    platform_fee_bps: number;
    distribution_policy: "PullMerkle" | "PushBatched" | "Streamed";
    status: "Active" | "Paused" | "Ended" | "Cancelled";
    mode: {
        type: "ByTime" | "ByBudget" | "ByParticipants" | "ByManual" | "ByFirstClaim";
        value?: bigint;
    };
    cancel_policy: CancelPolicy;
    merkle_root: Uint8Array;
    api_credit: bigint;
    api_fee_per_check: bigint;
    api_used: bigint;
    total_claimed: bigint;
    claims_count: bigint;
    campaign_id: string;
    participants_hash: Uint8Array;
    token_metadata_hash: Uint8Array;
}

// Re-export types from redeemer
export type { ClaimData, CampaignRedeemer } from "./redeemer";
