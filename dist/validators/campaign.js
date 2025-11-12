"use strict";
/**
 * Task2Earn Campaign Validator
 *
 * This is a TypeScript representation of the validator logic.
 * The actual Plutus validator would be compiled separately.
 *
 * Note: Plu-ts is extremely low-level and requires significant expertise.
 * For production, consider using Aiken or OpShin for better developer experience.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compiledCampaignValidator = exports.campaignValidator = exports.CampaignValidator = void 0;
const merkle_1 = require("../lib/merkle");
const utils_1 = require("../lib/utils");
/**
 * Main validator logic (TypeScript representation)
 * This would be compiled to UPLC for on-chain execution
 */
class CampaignValidator {
    /**
     * Validate a campaign operation
     */
    static validate(datum, redeemer, context // ScriptContext in actual Plutus
    ) {
        switch (redeemer.type) {
            case "Deposit":
                return this.validateDeposit(datum, context);
            case "SetRoot":
                return this.validateSetRoot(datum, redeemer.new_root, context);
            case "Claim":
                return this.validateClaim(datum, redeemer.claim_data, context);
            case "Finalize":
                return this.validateFinalize(datum, context);
            case "Cancel":
                return this.validateCancel(datum, context);
            case "Pause":
                return this.validatePause(datum, context);
            case "Resume":
                return this.validateResume(datum, context);
            case "UpdateCredit":
                return this.validateUpdateCredit(datum, redeemer.additional_credit, context);
            case "VerifyTask":
                return this.validateVerifyTask(datum, redeemer.task_id, redeemer.credit_used, context);
            default:
                return false;
        }
    }
    static validateDeposit(datum, context) {
        // Verify owner signature
        // Verify status is Active
        // Verify pool amount matches locked value
        return datum.status === "Active";
    }
    static validateSetRoot(datum, newRoot, context) {
        // Verify authorization
        // Verify campaign is Active
        // Verify new root is not empty
        // Verify continuing datum has updated root
        // Verify status transitions to Ended
        return datum.status === "Active" && newRoot.length > 0;
    }
    static validateClaim(datum, claimData, context) {
        // Compute leaf hash
        const leafHash = this.computeLeafHash(claimData.participant_address, claimData.reward_amount, datum.campaign_id);
        // Verify Merkle proof
        const proofValid = (0, merkle_1.verifyMerkleProof)(leafHash, claimData.merkle_proof, datum.merkle_root);
        if (!proofValid)
            return false;
        // Verify campaign status is Ended
        if (datum.status !== "Ended")
            return false;
        // Verify pool has sufficient balance
        if (!(0, utils_1.verifyPoolSufficiency)(datum.pool_amount, datum.total_claimed, claimData.reward_amount)) {
            return false;
        }
        // Verify participant receives exact amount
        // Verify continuing datum updated
        // Verify claims count incremented
        return true;
    }
    static validateFinalize(datum, context) {
        // Verify completion conditions
        // Calculate and transfer platform fee
        // Verify status transitions to Ended
        // Verify authorized
        return datum.status === "Active";
    }
    static validateCancel(datum, context) {
        // Check cancellation policy
        // Calculate penalty
        // Verify owner signature
        // Verify penalty sent to fee wallet
        // Verify refund sent to owner
        return datum.cancel_policy.allowed_before_claims ||
            (datum.cancel_policy.allowed_after_claims && datum.claims_count > 0n);
    }
    static validatePause(datum, context) {
        return datum.status === "Active";
    }
    static validateResume(datum, context) {
        return datum.status === "Paused";
    }
    static validateUpdateCredit(datum, additionalCredit, context) {
        // Verify owner signature
        // Verify credit incremented
        // Verify payment sent to fee wallet
        return additionalCredit > 0n;
    }
    static validateVerifyTask(datum, taskId, creditUsed, context) {
        // Verify sufficient credit
        // Verify api_used incremented
        // Verify status remains Active
        return datum.api_credit - datum.api_used >= creditUsed;
    }
    static computeLeafHash(address, amount, campaignId) {
        // This would use proper serialization and blake2b-256
        const addressBytes = new TextEncoder().encode(address);
        const amountBytes = new Uint8Array(8);
        new DataView(amountBytes.buffer).setBigUint64(0, amount, false);
        const campaignBytes = new TextEncoder().encode(campaignId);
        const combined = new Uint8Array(addressBytes.length + amountBytes.length + campaignBytes.length);
        combined.set(addressBytes, 0);
        combined.set(amountBytes, addressBytes.length);
        combined.set(campaignBytes, addressBytes.length + amountBytes.length);
        return combined; // Would be hashed with blake2b-256
    }
}
exports.CampaignValidator = CampaignValidator;
/**
 * Export validator for use in off-chain code
 */
exports.campaignValidator = CampaignValidator;
/**
 * Placeholder for compiled validator
 * In production, this would be the actual compiled Plutus script
 */
exports.compiledCampaignValidator = {
    type: "PlutusScriptV2",
    description: "Task2Earn Campaign Validator",
    cborHex: "placeholder_for_actual_compiled_script"
};
//# sourceMappingURL=campaign.js.map