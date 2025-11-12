/**
 * Task2Earn Smart Contract - Main Entry Point
 */

// Export validator
export { campaignValidator, compiledCampaignValidator } from "./validators/campaign";

// Export types
export type { CampaignDatum, AssetClass, CancelPolicy } from "./types/datum";
export type { CampaignRedeemer, ClaimData } from "./types/redeemer";

// Export off-chain utilities
export { CampaignTxBuilder } from "./offchain/tx-builder";
export type { CampaignConfig } from "./offchain/tx-builder";

export { MerkleTree, generateDistribution } from "./offchain/merkle-tree";
export type { ParticipantClaim, MerkleLeaf } from "./offchain/merkle-tree";

export { CampaignQuery } from "./offchain/query";
export type { BlockfrostConfig, KoiosConfig } from "./offchain/query";

// Export utility functions
export * from "./lib/utils";

/**
 * Contract Information
 */
export const CONTRACT_VERSION = "1.0.0";
export const CONTRACT_NAME = "Task2Earn Campaign Validator";
export const PLUTUS_VERSION = "V2";

/**
 * Constants
 */
export const MIN_ADA = 2_000_000n; // 2 ADA minimum
export const BASIS_POINTS = 10_000;
export const DEFAULT_FEE_BPS = 300; // 3%
export const DEFAULT_PENALTY_BPS = 500; // 5%
