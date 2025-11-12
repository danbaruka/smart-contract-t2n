/**
 * Utility functions for campaign operations
 */
export declare function calculateFee(poolAmount: bigint, feeBps: number): bigint;
export declare function calculatePenalty(poolAmount: bigint, penaltyBps: number): bigint;
export declare function verifyPoolSufficiency(poolAmount: bigint, totalClaimed: bigint, claimAmount: bigint): boolean;
export declare function checkMinAda(lovelaceAmount: bigint): boolean;
export declare function isDeadlinePassed(deadline: bigint, currentTime: bigint): boolean;
//# sourceMappingURL=utils.d.ts.map