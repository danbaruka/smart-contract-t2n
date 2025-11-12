/**
 * Task2Earn Campaign Validator
 *
 * This is a TypeScript representation of the validator logic.
 * The actual Plutus validator would be compiled separately.
 *
 * Note: Plu-ts is extremely low-level and requires significant expertise.
 * For production, consider using Aiken or OpShin for better developer experience.
 */
import { CampaignDatum, CampaignRedeemer } from "../types/datum";
/**
 * Main validator logic (TypeScript representation)
 * This would be compiled to UPLC for on-chain execution
 */
export declare class CampaignValidator {
    /**
     * Validate a campaign operation
     */
    static validate(datum: CampaignDatum, redeemer: CampaignRedeemer, context: any): boolean;
    private static validateDeposit;
    private static validateSetRoot;
    private static validateClaim;
    private static validateFinalize;
    private static validateCancel;
    private static validatePause;
    private static validateResume;
    private static validateUpdateCredit;
    private static validateVerifyTask;
    private static computeLeafHash;
}
/**
 * Export validator for use in off-chain code
 */
export declare const campaignValidator: typeof CampaignValidator;
/**
 * Placeholder for compiled validator
 * In production, this would be the actual compiled Plutus script
 */
export declare const compiledCampaignValidator: {
    type: string;
    description: string;
    cborHex: string;
};
//# sourceMappingURL=campaign.d.ts.map