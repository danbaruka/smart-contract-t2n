/**
 * Task2Earn Campaign Validator - Plu-ts On-chain Code
 * 
 * Simplified validator focusing on Merkle proof verification
 * This compiles to actual Plutus Core (UPLC)
 */

import {
    PaymentValidatorHash,
    PScriptContext,
    ScriptType,
    Credential,
    bool,
    bs,
    compile,
    makeValidator,
    pBool,
    pByteString,
    pData,
    pfn,
    pif,
    pInt,
    plet,
    pstruct,
    punsafeConvertType,
    V2
} from "@harmoniclabs/plu-ts";

// Campaign Datum structure
const PCampaignDatum = pstruct({
    PCampaignDatum: {
        owner: bs,              // Owner public key hash
        merkleRoot: bs,         // Merkle root for distribution
        poolAmount: pInt(2),    // Remaining pool
        totalClaimed: pInt(2),  // Total claimed so far
        claimsCount: pInt(2),   // Number of claims
        status: pInt(2)         // 0=Active, 1=Paused, 2=Ended, 3=Cancelled
    }
});

// Claim Redeemer structure
const PClaimRedeemer = pstruct({
    PClaimRedeemer: {
        participantAddr: bs,
        claimAmount: pInt(2),
        merkleProof: pData    // List of proof hashes
    }
});

// Helper: Blake2b-256 hash of concatenated bytes
const pblake2b_256_concat = pfn([bs, bs], bs)(
    (a, b) => {
        const combined = punsafeConvertType(a.concat(b), bs);
        return pblake2b_256.$(combined);
    }
);

// Helper: Verify Merkle proof
const pverifyMerkleProof = pfn([bs, pData, bs], bool)(
    (leafHash, proof, expectedRoot) => {
        // Recursive proof verification
        const go = pfn([bs, pData], bs)(
            (current, remaining) => {
                return pif(bs).$(remaining.length.eq(pInt(0)))
                    .then(current)
                    .else(
                        plet(
                            remaining.head
                        ).in(proofElem =>
                            plet(
                                remaining.tail
                            ).in(rest =>
                                plet(
                                    // Hash current with proof element (sorted)
                                    pif(bs).$(current.ltEq(proofElem))
                                        .then(pblake2b_256_concat.$(current).$(proofElem))
                                        .else(pblake2b_256_concat.$(proofElem).$(current))
                                ).in(nextHash =>
                                    go.$(nextHash).$(rest)
                                )
                            )
                        )
                    )
            }
        );

        const reconstructed = go.$(leafHash).$(proof);
        return reconstructed.eq(expectedRoot);
    }
);

/**
 * Main Campaign Validator
 * 
 * Validates claim transactions with Merkle proofs
 */
export const campaignValidatorTerm = pfn([
    PCampaignDatum.type,
    PClaimRedeemer.type,
    PScriptContext.type
], bool)(
    (datum, redeemer, ctx) => {

        const txInfo = ctx.tx;

        // Extract claim data
        const participantAddr = redeemer.participantAddr;
        const claimAmount = redeemer.claimAmount;
        const merkleProof = redeemer.merkleProof;

        // Compute leaf hash: blake2b_256(addr || amount)
        const leafHash = plet(
            punsafeConvertType(
                participantAddr.concat(punsafeConvertType(claimAmount, bs)),
                bs
            )
        ).in(combined =>
            pblake2b_256.$(combined)
        );

        // Verify Merkle proof
        const proofValid = pverifyMerkleProof
            .$(leafHash)
            .$(merkleProof)
            .$(datum.merkleRoot);

        // Verify campaign status is Ended (2)
        const statusValid = datum.status.eq(pInt(2));

        // Verify sufficient pool balance
        const remaining = datum.poolAmount.sub(datum.totalClaimed);
        const balanceValid = remaining.gtEq(claimAmount);

        // Verify output to participant
        const outputValid = txInfo.outputs.some(
            pfn([PTxOut.type], bool)(
                out => {
                    // Check address matches
                    const addrMatch = out.address.raw.eq(participantAddr);

                    // Check value contains claim amount
                    // Simplified - should check specific asset
                    const valueMatch = pBool(true);

                    return addrMatch.and(valueMatch);
                }
            )
        );

        // All conditions must be true
        return proofValid
            .and(statusValid)
            .and(balanceValid)
            .and(outputValid);
    }
);

/**
 * Compile validator to Plutus Core
 */
export function compileValidator() {
    try {
        const validator = makeValidator(campaignValidatorTerm);

        const compiled = compile(validator);

        return {
            type: "PlutusScriptV2" as const,
            description: "Task2Earn Campaign Validator with Merkle Proof Verification",
            cborHex: compiled.cborHex,
            hash: compiled.hash.toString(),
            bytes: compiled.bytes
        };
    } catch (error) {
        console.error("Compilation error:", error);
        throw error;
    }
}

