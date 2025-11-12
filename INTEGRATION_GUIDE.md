# Task2Earn Smart Contract - Integration Guide

This guide shows how to integrate the smart contract with your backend API.

## 🎯 Project Structure

```
TASK2EARN/
├── smartcontract/              # THIS PROJECT (Smart Contract)
│   ├── validators/             # Aiken validator
│   ├── src/
│   │   ├── offchain/           # Transaction builders & utilities
│   │   └── types/              # TypeScript types
│   └── plutus.json             # Compiled contract
│
└── api/                        # YOUR BACKEND API (Separate Project)
    └── app/
        ├── controllers/        # API endpoints
        ├── services/           # Business logic
        └── models/             # Database models
```

## 📦 What This Project Provides

### 1. Compiled Smart Contract
- **File:** `plutus.json`
- **Use:** Deploy on Cardano blockchain

### 2. Transaction Builders
- **File:** `src/offchain/complete-tx-builder.ts`
- **Functions:**
  - `buildDeployTx()` - Deploy campaign
  - `buildSetRootTx()` - Finalize with Merkle root
  - `buildClaimTx()` - Process claim
  - `buildPauseTx()` - Pause campaign
  - `buildResumeTx()` - Resume campaign
  - `buildCancelTx()` - Cancel campaign

### 3. Merkle Tree Implementation
- **File:** `src/offchain/merkle-tree.ts`
- **Functions:**
  - `new MerkleTree(participants, campaignId)` - Generate tree
  - `getRoot()` - Get Merkle root
  - `getProof(address)` - Get claim proof
  - `verify()` - Verify proof

### 4. Blockchain Query Utilities
- **File:** `src/offchain/query.ts`
- **Functions:**
  - Query UTxOs
  - Query script state
  - Monitor transactions

## 🔗 How to Use in Your API

### Installation in API Project

```bash
# In your API project (api/)
npm install --save ../smartcontract

# Or add to package.json:
{
  "dependencies": {
    "task2earn-contract": "file:../smartcontract"
  }
}
```

### Example: Campaign Service in Your API

```typescript
// api/app/services/campaign_service.ts

import { CampaignTxBuilder } from 'task2earn-contract/src/offchain/complete-tx-builder';
import { MerkleTree } from 'task2earn-contract/src/offchain/merkle-tree';
import Campaign from 'App/Models/Campaign';  // Your database model
import Participant from 'App/Models/Participant';

export class CampaignService {
  private txBuilder: CampaignTxBuilder;

  constructor() {
    const scriptAddress = 'addr_test1...';  // From deployment
    const scriptCbor = require('task2earn-contract/plutus.json');
    this.txBuilder = new CampaignTxBuilder(scriptAddress, scriptCbor);
  }

  // Deploy campaign on-chain
  async deployCampaign(campaignId: string, ownerPkh: string) {
    // 1. Get campaign from database
    const campaign = await Campaign.find(campaignId);
    
    // 2. Build transaction
    const { txBody, datum } = await this.txBuilder.buildDeployTx({
      ownerPkh,
      poolAmount: campaign.poolAmount,
      walletUtxo: campaign.ownerUtxo,
      changeAddress: campaign.ownerAddress
    });

    // 3. Submit transaction (using Lucid/Mesh)
    const txHash = await this.submitTx(txBody);

    // 4. Update database
    campaign.txHash = txHash;
    campaign.status = 'active';
    await campaign.save();

    return { txHash, campaign };
  }

  // Finalize campaign
  async finalizeCampaign(campaignId: string) {
    // 1. Get participants from database
    const participants = await Participant
      .query()
      .where('campaignId', campaignId)
      .select('address', 'xpEarned');

    // 2. Calculate rewards
    const totalXp = participants.reduce((sum, p) => sum + p.xpEarned, 0);
    const participantClaims = participants.map(p => ({
      address: p.address,
      amount: (campaign.poolAmount * BigInt(p.xpEarned)) / BigInt(totalXp)
    }));

    // 3. Generate Merkle tree
    const merkleTree = new MerkleTree(participantClaims, campaignId);
    const merkleRoot = merkleTree.getRootHex();

    // 4. Build SetRoot transaction
    const { txBody } = await this.txBuilder.buildSetRootTx({
      campaignUtxo: campaign.scriptUtxo,
      currentDatum: campaign.datum,
      merkleRoot,
      ownerPkh: campaign.ownerPkh,
      walletUtxo: campaign.ownerUtxo,
      changeAddress: campaign.ownerAddress
    });

    // 5. Submit transaction
    const txHash = await this.submitTx(txBody);

    // 6. Update database
    campaign.merkleRoot = merkleRoot;
    campaign.status = 'ended';
    await campaign.save();

    // Store Merkle tree for proof generation
    await this.storeMerkleTree(campaignId, merkleTree);

    return { txHash, merkleRoot };
  }

  // Get claim proof
  async getClaimProof(campaignId: string, participantAddress: string) {
    // 1. Load Merkle tree from storage
    const merkleTree = await this.loadMerkleTree(campaignId);

    // 2. Generate proof
    const proof = merkleTree.getProof(participantAddress);

    // 3. Get participant reward amount
    const participant = await Participant
      .query()
      .where({ campaignId, address: participantAddress })
      .first();

    return {
      address: participantAddress,
      amount: participant.rewardAmount,
      proof: proof.map(p => Buffer.from(p).toString('hex')),
      alreadyClaimed: participant.claimed
    };
  }

  // Process claim
  async processClaim(campaignId: string, participantAddress: string) {
    // 1. Get claim proof
    const claimProof = await this.getClaimProof(campaignId, participantAddress);

    if (claimProof.alreadyClaimed) {
      throw new Error('Already claimed');
    }

    // 2. Build claim transaction
    const { txBody } = await this.txBuilder.buildClaimTx({
      campaignUtxo: campaign.scriptUtxo,
      currentDatum: campaign.datum,
      claimData: {
        participantAddr: participantAddress,
        claimAmount: claimProof.amount,
        merkleProof: claimProof.proof
      },
      participantAddress,
      walletUtxo: participantUtxo,
      changeAddress: participantAddress
    });

    // 3. Submit transaction
    const txHash = await this.submitTx(txBody);

    // 4. Update database
    participant.claimed = true;
    participant.claimedAt = new Date();
    await participant.save();

    campaign.totalClaimed += claimProof.amount;
    campaign.claimsCount++;
    await campaign.save();

    return { txHash, amount: claimProof.amount };
  }

  private async submitTx(txBody: string): Promise<string> {
    // Use Lucid or Mesh to submit
    // Implementation depends on your setup
    return 'tx-hash';
  }

  private async storeMerkleTree(campaignId: string, tree: MerkleTree) {
    // Store in Redis, file system, or database
  }

  private async loadMerkleTree(campaignId: string): Promise<MerkleTree> {
    // Load from storage
  }
}
```

### Example: API Controller

```typescript
// api/app/controllers/campaigns_controller.ts

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { CampaignService } from 'App/Services/CampaignService'

export default class CampaignsController {
  private service = new CampaignService();

  // POST /api/campaigns/:id/finalize
  public async finalize({ params, response }: HttpContextContract) {
    try {
      const result = await this.service.finalizeCampaign(params.id);
      
      return response.ok({
        success: true,
        data: result
      });
    } catch (error) {
      return response.badRequest({
        error: error.message
      });
    }
  }

  // GET /api/campaigns/:id/claim-proof/:address
  public async getClaimProof({ params, response }: HttpContextContract) {
    try {
      const proof = await this.service.getClaimProof(
        params.id,
        params.address
      );
      
      return response.ok({
        success: true,
        data: proof
      });
    } catch (error) {
      return response.badRequest({
        error: error.message
      });
    }
  }

  // POST /api/campaigns/:id/claim
  public async claim({ params, request, response }: HttpContextContract) {
    try {
      const { participantAddress } = request.only(['participantAddress']);
      
      const result = await this.service.processClaim(
        params.id,
        participantAddress
      );
      
      return response.ok({
        success: true,
        data: result
      });
    } catch (error) {
      return response.badRequest({
        error: error.message
      });
    }
  }
}
```

## 📝 API Endpoints to Implement

### Campaign Management
- `POST /api/campaigns` - Create campaign (database only)
- `POST /api/campaigns/:id/deploy` - Deploy on-chain
- `GET /api/campaigns/:id` - Get campaign details
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns/:id/finalize` - Finalize & set Merkle root

### Task Tracking
- `POST /api/campaigns/:id/tasks/complete` - Record task completion
- `GET /api/campaigns/:id/participants/:address` - Get participant stats

### Claims
- `GET /api/campaigns/:id/claim-proof/:address` - Get Merkle proof
- `POST /api/campaigns/:id/claim` - Process claim transaction

## 🔒 Security Considerations

### In Your API:
1. **Authentication** - Verify user owns wallet address
2. **Rate Limiting** - Prevent spam
3. **Input Validation** - Validate all inputs
4. **Database** - Track claimed addresses
5. **Audit Log** - Log all operations

### Smart Contract Handles:
1. ✅ Merkle proof verification
2. ✅ Double-claim prevention (on-chain tracking)
3. ✅ Owner authorization
4. ✅ Balance protection
5. ✅ Exact amount verification

## 🗄️ Database Schema Example

```sql
-- campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  owner_pkh VARCHAR(56) NOT NULL,
  name VARCHAR(255) NOT NULL,
  pool_amount BIGINT NOT NULL,
  merkle_root VARCHAR(64),
  status VARCHAR(20) NOT NULL,
  tx_hash VARCHAR(64),
  script_utxo_tx_hash VARCHAR(64),
  script_utxo_index INTEGER,
  total_claimed BIGINT DEFAULT 0,
  claims_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  address VARCHAR(108) NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  reward_amount BIGINT,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  UNIQUE(campaign_id, address)
);

-- tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  name VARCHAR(255) NOT NULL,
  xp_reward INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL
);

-- task_completions table
CREATE TABLE task_completions (
  id UUID PRIMARY KEY,
  participant_id UUID REFERENCES participants(id),
  task_id UUID REFERENCES tasks(id),
  completed_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment Flow

1. **API Creates Campaign** (Database)
2. **API Calls `buildDeployTx()`** (Smart Contract)
3. **User Signs & Submits** (Blockchain)
4. **API Updates Database** (tx hash, status)
5. **Users Complete Tasks** (Database tracking)
6. **API Calls `buildSetRootTx()`** (Smart Contract)
7. **Owner Signs & Submits** (Blockchain)
8. **Users Claim** (API provides proof, smart contract verifies)

## 📚 Complete Example

See `/api/examples/campaign-integration.ts` (in your API project) for a complete working example.

---

**Remember:** 
- Smart Contract = On-chain validation & security
- API = Business logic, database, user management
- They work together but are separate concerns

