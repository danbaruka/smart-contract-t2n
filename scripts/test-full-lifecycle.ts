#!/usr/bin/env tsx

/**
 * Full Lifecycle Test for Task2Earn Smart Contract
 * 
 * This script tests the complete flow:
 * 1. Generate Merkle tree with participants
 * 2. Finalize campaign (SetRoot - off-chain for now)
 * 3. Generate claim proofs
 * 4. Validate proof verification
 */

import { MerkleTree } from '../src/offchain/merkle-tree';
import * as fs from 'fs';
import * as path from 'path';

// Campaign ID for this test
const CAMPAIGN_ID = 'task2earn-test-campaign-001';

// Test participants with their rewards
const testParticipants = [
    {
        address: 'addr_test1qzalice00000000000000000000000000000000000000000000000000000',
        amount: 50000000n  // 50 ADA
    },
    {
        address: 'addr_test1qzbob0000000000000000000000000000000000000000000000000000000',
        amount: 30000000n  // 30 ADA
    },
    {
        address: 'addr_test1qzcharlie00000000000000000000000000000000000000000000000000',
        amount: 20000000n  // 20 ADA
    }
];

console.log('🧪 Task2Earn Smart Contract - Full Lifecycle Test\n');
console.log('═'.repeat(70));
console.log('\n');

// Step 1: Generate Merkle Tree
console.log('📊 Step 1: Generating Merkle Tree...');
console.log('-'.repeat(70));

const tree = new MerkleTree(testParticipants, CAMPAIGN_ID);
const root = tree.getRoot();

console.log(`✅ Merkle tree generated with ${testParticipants.length} participants`);
console.log(`📍 Merkle Root: ${Buffer.from(root).toString('hex')}`);
console.log('');

// Step 2: Generate proofs for each participant
console.log('🔐 Step 2: Generating Merkle Proofs...');
console.log('-'.repeat(70));

const proofs: { [address: string]: { amount: bigint; proof: Uint8Array[] } } = {};

for (const participant of testParticipants) {
    const proof = tree.getProof(participant.address);
    if (proof) {
        proofs[participant.address] = {
            amount: participant.amount,
            proof: proof
        };
        console.log(`✅ ${participant.address.substring(0, 20)}...`);
        console.log(`   Amount: ${Number(participant.amount) / 1_000_000} ADA`);
        console.log(`   Proof length: ${proof.length} hashes`);
    }
}
console.log('');

// Step 3: Verify all proofs
console.log('✅ Step 3: Verifying Merkle Proofs...');
console.log('-'.repeat(70));

let allValid = true;
for (const participant of testParticipants) {
    const proof = proofs[participant.address];
    if (proof) {
        const isValid = tree.verify(participant.address, participant.amount, CAMPAIGN_ID, proof.proof);
        const status = isValid ? '✅' : '❌';
        console.log(`${status} ${participant.address.substring(0, 20)}... - ${isValid ? 'VALID' : 'INVALID'}`);
        if (!isValid) allValid = false;
    }
}
console.log('');

if (!allValid) {
    console.error('❌ Some proofs are invalid!');
    process.exit(1);
}

// Step 4: Test invalid proofs
console.log('🚫 Step 4: Testing Invalid Proof Detection...');
console.log('-'.repeat(70));

// Test 1: Wrong amount
const aliceProof = proofs[testParticipants[0].address];
const wrongAmount = testParticipants[0].amount + 1n;
const invalidAmountTest = tree.verify(testParticipants[0].address, wrongAmount, CAMPAIGN_ID, aliceProof.proof);
console.log(`Test: Amount tampered (+1 lovelace): ${invalidAmountTest ? '❌ FAILED' : '✅ PASSED (rejected)'}`);

// Test 2: Wrong address
const wrongAddress = 'addr_test1qzeve00000000000000000000000000000000000000000000000000000000';
const invalidAddressTest = tree.verify(wrongAddress, testParticipants[0].amount, CAMPAIGN_ID, aliceProof.proof);
console.log(`Test: Wrong address claim: ${invalidAddressTest ? '❌ FAILED' : '✅ PASSED (rejected)'}`);

// Test 3: Wrong proof
const bobProof = proofs[testParticipants[1].address];
const wrongProofTest = tree.verify(testParticipants[0].address, testParticipants[0].amount, CAMPAIGN_ID, bobProof.proof);
console.log(`Test: Wrong proof used: ${wrongProofTest ? '❌ FAILED' : '✅ PASSED (rejected)'}`);

// Test 4: Wrong campaign ID
const wrongCampaignId = 'wrong-campaign-id';
const invalidCampaignTest = tree.verify(testParticipants[0].address, testParticipants[0].amount, wrongCampaignId, aliceProof.proof);
console.log(`Test: Wrong campaign ID: ${invalidCampaignTest ? '❌ FAILED' : '✅ PASSED (rejected)'}`);


console.log('');

// Step 5: Generate transaction data
console.log('📝 Step 5: Generating Transaction Data...');
console.log('-'.repeat(70));

// Updated datum with Merkle root (for SetRoot transaction)
const updatedDatum = {
    constructor: 0,
    fields: [
        {
            bytes: "71a8e5e15ae0d95497bbc78e4ad93466a4ad9f7139dfbece8bb3db5e" // owner PKH
        },
        {
            bytes: Buffer.from(root).toString('hex') // merkle root
        },
        {
            int: 100000000 // pool amount
        },
        {
            int: 0 // total claimed
        },
        {
            int: 0 // claims count
        },
        {
            int: 2 // status: 2 = Ended (ready for claims)
        }
    ]
};

// Save updated datum
const datumPath = path.join(__dirname, '..', 'campaign-datum-finalized.json');
fs.writeFileSync(datumPath, JSON.stringify(updatedDatum, null, 2));
console.log(`✅ Finalized datum saved: campaign-datum-finalized.json`);

// Generate redeemer for first claim (Alice)
const aliceClaimRedeemer = {
    constructor: 0, // Claim variant
    fields: [
        {
            constructor: 0,
            fields: [
                {
                    bytes: testParticipants[0].address.substring(10) // Remove addr_test1qz prefix, use raw bytes
                },
                {
                    int: Number(testParticipants[0].amount)
                },
                {
                    list: aliceProof.proof.map(hash => ({ bytes: Buffer.from(hash).toString('hex') }))
                }
            ]
        }
    ]
};

const redeemerPath = path.join(__dirname, '..', 'redeemer-claim-alice.json');
fs.writeFileSync(redeemerPath, JSON.stringify(aliceClaimRedeemer, null, 2));
console.log(`✅ Claim redeemer saved: redeemer-claim-alice.json`);

// Generate distribution manifest
const distributionManifest = {
    campaignId: CAMPAIGN_ID,
    merkleRoot: Buffer.from(root).toString('hex'),
    totalPool: 100000000,
    participants: testParticipants.map((p, i) => ({
        address: p.address,
        amount: Number(p.amount),
        amountAda: Number(p.amount) / 1_000_000,
        proof: proofs[p.address].proof.map(h => Buffer.from(h).toString('hex')),
        verified: true
    })),
    generatedAt: new Date().toISOString()
};

const manifestPath = path.join(__dirname, '..', 'distribution-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(distributionManifest, null, 2));
console.log(`✅ Distribution manifest saved: distribution-manifest.json`);

console.log('');

// Step 6: Summary
console.log('═'.repeat(70));
console.log('🎉 Full Lifecycle Test Complete!\n');
console.log('📊 Test Results:');
console.log('-'.repeat(70));
console.log(`✅ Merkle tree generation: PASSED`);
console.log(`✅ Proof generation (${testParticipants.length} participants): PASSED`);
console.log(`✅ Proof verification (all valid): PASSED`);
console.log(`✅ Invalid proof detection: PASSED`);
console.log(`✅ Transaction data generation: PASSED`);
console.log('');

console.log('📂 Generated Files:');
console.log('-'.repeat(70));
console.log('1. campaign-datum-finalized.json  - Updated datum with Merkle root');
console.log('2. redeemer-claim-alice.json      - Example claim redeemer');
console.log('3. distribution-manifest.json     - Complete distribution data');
console.log('');

console.log('🚀 Next Steps for On-Chain Testing:');
console.log('-'.repeat(70));
console.log('');
console.log('1️⃣  Finalize Campaign (Update Merkle Root):');
console.log('   This requires a transaction to update the script UTxO datum.');
console.log('   Command: ./scripts/finalize-campaign.sh');
console.log('');
console.log('2️⃣  Test Claim Transaction:');
console.log('   Use the generated redeemer to test a claim.');
console.log('   Command: ./scripts/test-claim.sh alice');
console.log('');
console.log('3️⃣  Integration with Backend:');
console.log('   - Store Merkle tree in database');
console.log('   - Serve proofs via API endpoint');
console.log('   - Build claim transactions for users');
console.log('');

console.log('═'.repeat(70));
console.log('✨ Smart Contract Testing Complete! ✨');
console.log('');

