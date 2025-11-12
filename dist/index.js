"use strict";
/**
 * Task2Earn Smart Contract - Main Entry Point
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PENALTY_BPS = exports.DEFAULT_FEE_BPS = exports.BASIS_POINTS = exports.MIN_ADA = exports.PLUTUS_VERSION = exports.CONTRACT_NAME = exports.CONTRACT_VERSION = exports.CampaignQuery = exports.generateDistribution = exports.MerkleTree = exports.CampaignTxBuilder = exports.compiledCampaignValidator = exports.campaignValidator = void 0;
// Export validator
var campaign_1 = require("./validators/campaign");
Object.defineProperty(exports, "campaignValidator", { enumerable: true, get: function () { return campaign_1.campaignValidator; } });
Object.defineProperty(exports, "compiledCampaignValidator", { enumerable: true, get: function () { return campaign_1.compiledCampaignValidator; } });
// Export off-chain utilities
var tx_builder_1 = require("./offchain/tx-builder");
Object.defineProperty(exports, "CampaignTxBuilder", { enumerable: true, get: function () { return tx_builder_1.CampaignTxBuilder; } });
var merkle_tree_1 = require("./offchain/merkle-tree");
Object.defineProperty(exports, "MerkleTree", { enumerable: true, get: function () { return merkle_tree_1.MerkleTree; } });
Object.defineProperty(exports, "generateDistribution", { enumerable: true, get: function () { return merkle_tree_1.generateDistribution; } });
var query_1 = require("./offchain/query");
Object.defineProperty(exports, "CampaignQuery", { enumerable: true, get: function () { return query_1.CampaignQuery; } });
// Export utility functions
__exportStar(require("./lib/utils"), exports);
/**
 * Contract Information
 */
exports.CONTRACT_VERSION = "1.0.0";
exports.CONTRACT_NAME = "Task2Earn Campaign Validator";
exports.PLUTUS_VERSION = "V2";
/**
 * Constants
 */
exports.MIN_ADA = 2000000n; // 2 ADA minimum
exports.BASIS_POINTS = 10_000;
exports.DEFAULT_FEE_BPS = 300; // 3%
exports.DEFAULT_PENALTY_BPS = 500; // 5%
//# sourceMappingURL=index.js.map