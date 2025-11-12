"use strict";
/**
 * Utility functions for campaign operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFee = calculateFee;
exports.calculatePenalty = calculatePenalty;
exports.verifyPoolSufficiency = verifyPoolSufficiency;
exports.checkMinAda = checkMinAda;
exports.isDeadlinePassed = isDeadlinePassed;
function calculateFee(poolAmount, feeBps) {
    return (poolAmount * BigInt(feeBps)) / 10000n;
}
function calculatePenalty(poolAmount, penaltyBps) {
    return (poolAmount * BigInt(penaltyBps)) / 10000n;
}
function verifyPoolSufficiency(poolAmount, totalClaimed, claimAmount) {
    const remaining = poolAmount - totalClaimed;
    return remaining >= claimAmount;
}
function checkMinAda(lovelaceAmount) {
    return lovelaceAmount >= 2000000n; // 2 ADA minimum
}
function isDeadlinePassed(deadline, currentTime) {
    return currentTime >= deadline;
}
//# sourceMappingURL=utils.js.map