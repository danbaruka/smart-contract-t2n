/**
 * Task2Earn Smart Contract - Main Entry Point
 */
export { campaignValidator, compiledCampaignValidator } from "./validators/campaign";
export type { CampaignDatum, AssetClass, CancelPolicy } from "./types/datum";
export type { CampaignRedeemer, ClaimData } from "./types/redeemer";
export { CampaignTxBuilder } from "./offchain/tx-builder";
export type { CampaignConfig } from "./offchain/tx-builder";
export { MerkleTree, generateDistribution } from "./offchain/merkle-tree";
export type { ParticipantClaim, MerkleLeaf } from "./offchain/merkle-tree";
export { CampaignQuery } from "./offchain/query";
export type { BlockfrostConfig, KoiosConfig } from "./offchain/query";
export * from "./lib/utils";
/**
 * Contract Information
 */
export declare const CONTRACT_VERSION = "1.0.0";
export declare const CONTRACT_NAME = "Task2Earn Campaign Validator";
export declare const PLUTUS_VERSION = "V2";
/**
 * Constants
 */
export declare const MIN_ADA = 2000000n;
export declare const BASIS_POINTS = 10000;
export declare const DEFAULT_FEE_BPS = 300;
export declare const DEFAULT_PENALTY_BPS = 500;
//# sourceMappingURL=index.d.ts.map