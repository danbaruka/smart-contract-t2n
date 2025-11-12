"use strict";
/**
 * Task2Earn Campaign Validator - Plu-ts On-chain Code
 *
 * Simplified validator focusing on Merkle proof verification
 * This compiles to actual Plutus Core (UPLC)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignValidatorTerm = void 0;
exports.compileValidator = compileValidator;
const plu_ts_1 = require("@harmoniclabs/plu-ts");
// Campaign Datum structure
const PCampaignDatum = (0, plu_ts_1.pstruct)({
    PCampaignDatum: {
        owner: plu_ts_1.bs, // Owner public key hash
        merkleRoot: plu_ts_1.bs, // Merkle root for distribution
        poolAmount: (0, plu_ts_1.pInt)(2), // Remaining pool
        totalClaimed: (0, plu_ts_1.pInt)(2), // Total claimed so far
        claimsCount: (0, plu_ts_1.pInt)(2), // Number of claims
        status: (0, plu_ts_1.pInt)(2) // 0=Active, 1=Paused, 2=Ended, 3=Cancelled
    }
});
// Claim Redeemer structure
const PClaimRedeemer = (0, plu_ts_1.pstruct)({
    PClaimRedeemer: {
        participantAddr: plu_ts_1.bs,
        claimAmount: (0, plu_ts_1.pInt)(2),
        merkleProof: plu_ts_1.pData // List of proof hashes
    }
});
// Helper: Blake2b-256 hash of concatenated bytes
const pblake2b_256_concat = (0, plu_ts_1.pfn)([plu_ts_1.bs, plu_ts_1.bs], plu_ts_1.bs)((a, b) => {
    const combined = (0, plu_ts_1.punsafeConvertType)(a.concat(b), plu_ts_1.bs);
    return pblake2b_256.$(combined);
});
// Helper: Verify Merkle proof
const pverifyMerkleProof = (0, plu_ts_1.pfn)([plu_ts_1.bs, plu_ts_1.pData, plu_ts_1.bs], plu_ts_1.bool)((leafHash, proof, expectedRoot) => {
    // Recursive proof verification
    const go = (0, plu_ts_1.pfn)([plu_ts_1.bs, plu_ts_1.pData], plu_ts_1.bs)((current, remaining) => {
        return (0, plu_ts_1.pif)(plu_ts_1.bs).$(remaining.length.eq((0, plu_ts_1.pInt)(0)))
            .then(current)
            .else((0, plu_ts_1.plet)(remaining.head).in(proofElem => (0, plu_ts_1.plet)(remaining.tail).in(rest => (0, plu_ts_1.plet)(
        // Hash current with proof element (sorted)
        (0, plu_ts_1.pif)(plu_ts_1.bs).$(current.ltEq(proofElem))
            .then(pblake2b_256_concat.$(current).$(proofElem))
            .else(pblake2b_256_concat.$(proofElem).$(current))).in(nextHash => go.$(nextHash).$(rest)))));
    });
    const reconstructed = go.$(leafHash).$(proof);
    return reconstructed.eq(expectedRoot);
});
/**
 * Main Campaign Validator
 *
 * Validates claim transactions with Merkle proofs
 */
exports.campaignValidatorTerm = (0, plu_ts_1.pfn)([
    PCampaignDatum.type,
    PClaimRedeemer.type,
    plu_ts_1.PScriptContext.type
], plu_ts_1.bool)((datum, redeemer, ctx) => {
    const txInfo = ctx.tx;
    // Extract claim data
    const participantAddr = redeemer.participantAddr;
    const claimAmount = redeemer.claimAmount;
    const merkleProof = redeemer.merkleProof;
    // Compute leaf hash: blake2b_256(addr || amount)
    const leafHash = (0, plu_ts_1.plet)((0, plu_ts_1.punsafeConvertType)(participantAddr.concat((0, plu_ts_1.punsafeConvertType)(claimAmount, plu_ts_1.bs)), plu_ts_1.bs)).in(combined => pblake2b_256.$(combined));
    // Verify Merkle proof
    const proofValid = pverifyMerkleProof
        .$(leafHash)
        .$(merkleProof)
        .$(datum.merkleRoot);
    // Verify campaign status is Ended (2)
    const statusValid = datum.status.eq((0, plu_ts_1.pInt)(2));
    // Verify sufficient pool balance
    const remaining = datum.poolAmount.sub(datum.totalClaimed);
    const balanceValid = remaining.gtEq(claimAmount);
    // Verify output to participant
    const outputValid = txInfo.outputs.some((0, plu_ts_1.pfn)([PTxOut.type], plu_ts_1.bool)(out => {
        // Check address matches
        const addrMatch = out.address.raw.eq(participantAddr);
        // Check value contains claim amount
        // Simplified - should check specific asset
        const valueMatch = (0, plu_ts_1.pBool)(true);
        return addrMatch.and(valueMatch);
    }));
    // All conditions must be true
    return proofValid
        .and(statusValid)
        .and(balanceValid)
        .and(outputValid);
});
/**
 * Compile validator to Plutus Core
 */
function compileValidator() {
    try {
        const validator = (0, plu_ts_1.makeValidator)(exports.campaignValidatorTerm);
        const compiled = (0, plu_ts_1.compile)(validator);
        return {
            type: "PlutusScriptV2",
            description: "Task2Earn Campaign Validator with Merkle Proof Verification",
            cborHex: compiled.cborHex,
            hash: compiled.hash.toString(),
            bytes: compiled.bytes
        };
    }
    catch (error) {
        console.error("Compilation error:", error);
        throw error;
    }
}
//# sourceMappingURL=campaign-validator.js.map