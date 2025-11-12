/**
 * Utility functions for campaign operations
 */

export function calculateFee(poolAmount: bigint, feeBps: number): bigint {
    return (poolAmount * BigInt(feeBps)) / 10000n;
}

export function calculatePenalty(poolAmount: bigint, penaltyBps: number): bigint {
    return (poolAmount * BigInt(penaltyBps)) / 10000n;
}

export function verifyPoolSufficiency(
    poolAmount: bigint,
    totalClaimed: bigint,
    claimAmount: bigint
): boolean {
    const remaining = poolAmount - totalClaimed;
    return remaining >= claimAmount;
}

export function checkMinAda(lovelaceAmount: bigint): boolean {
    return lovelaceAmount >= 2_000_000n; // 2 ADA minimum
}

export function isDeadlinePassed(
    deadline: bigint,
    currentTime: bigint
): boolean {
    return currentTime >= deadline;
}
