/**
 * Campaign Redeemer Types
 * Simplified for Plu-ts compatibility
 */

export interface ClaimData {
    participant_address: string;
    reward_amount: bigint;
    merkle_proof: Uint8Array[];
}

export type CampaignRedeemer =
    | { type: "Deposit" }
    | { type: "SetRoot"; new_root: Uint8Array }
    | { type: "Claim"; claim_data: ClaimData }
    | { type: "Finalize" }
    | { type: "Cancel" }
    | { type: "Pause" }
    | { type: "Resume" }
    | { type: "UpdateCredit"; additional_credit: bigint }
    | { type: "VerifyTask"; task_id: Uint8Array; credit_used: bigint };
