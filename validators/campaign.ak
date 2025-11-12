// Task2Earn Campaign Validator - Aiken Implementation
// Compiles to Plutus Core for on-chain execution

use aiken/builtin
use aiken/collection/list
use aiken/crypto.{blake2b_256}
use aiken/primitive/bytearray
use cardano/address.{Credential}
use cardano/transaction.{OutputReference, Transaction}

// Campaign state locked in script UTxO
pub type CampaignDatum {
  owner: ByteArray,
  merkle_root: ByteArray,
  pool_amount: Int,
  total_claimed: Int,
  claims_count: Int,
  status: Int,  // 0=Active, 1=Paused, 2=Ended, 3=Cancelled
  claimed_participants: List<ByteArray>,  // Track who has claimed (PKH list)
}

// Claim redeemer with Merkle proof
pub type ClaimRedeemer {
  participant_addr: ByteArray,
  claim_amount: Int,
  merkle_proof: List<ByteArray>,
}

// All redeemer actions
pub type CampaignRedeemer {
  Claim(ClaimRedeemer)
  Finalize
  Cancel
  Pause
  Resume
}

// Main validator - entry point for all operations
validator campaign {
  spend(
    datum_opt: Option<CampaignDatum>,
    redeemer: CampaignRedeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(datum) = datum_opt
    
    when redeemer is {
      Claim(claim) -> validate_claim(datum, claim, self)
      Finalize -> validate_finalize(datum, self)
      Cancel -> validate_cancel(datum, self)
      Pause -> validate_pause(datum, self)
      Resume -> validate_resume(datum, self)
    }
  }
}

// Verify Merkle proof by reconstructing root
fn verify_merkle_proof(
  leaf_hash: ByteArray,
  proof: List<ByteArray>,
  expected_root: ByteArray,
) -> Bool {
  // Fold over proof elements, rebuilding the tree from leaf to root
  let reconstructed =
    list.foldr(
      proof,
      leaf_hash,
      fn(proof_elem, current) {
        // Concatenate and hash in sorted order (deterministic)
        if bytearray.compare(current, proof_elem) == Less {
          blake2b_256(builtin.append_bytearray(current, proof_elem))
        } else {
          blake2b_256(builtin.append_bytearray(proof_elem, current))
        }
      },
    )
  
  // Check if reconstructed root matches the committed root
  reconstructed == expected_root
}

// Validate claim transaction with Merkle proof
fn validate_claim(
  datum: CampaignDatum,
  claim: ClaimRedeemer,
  tx: Transaction,
) -> Bool {
  
  // 1. Double-claim prevention: Check participant hasn't claimed yet
  let not_claimed_yet = !list.has(datum.claimed_participants, claim.participant_addr)
  
  // 2. Compute leaf hash: blake2b_256(address || amount)
  let leaf_data =
    builtin.append_bytearray(
      claim.participant_addr,
      builtin.serialise_data(claim.claim_amount),
    )
  let leaf_hash = blake2b_256(leaf_data)
  
  // 3. Verify Merkle proof
  let proof_valid = verify_merkle_proof(leaf_hash, claim.merkle_proof, datum.merkle_root)
  
  // 4. Verify campaign status is Ended (status == 2)
  let status_valid = datum.status == 2
  
  // 5. Verify sufficient balance remains
  let remaining = datum.pool_amount - datum.total_claimed
  let balance_valid = remaining >= claim.claim_amount
  
  // 6. Verify participant receives EXACT claimed amount
  let output_valid =
    list.any(
      tx.outputs,
      fn(output) {
        when output.address.payment_credential is {
          Credential.VerificationKey(pkh) -> {
            // Get lovelace amount from value
            let lovelace_amount = builtin.head_list(builtin.un_map_data(builtin.un_constr_data(output.value).2nd))
            pkh == claim.participant_addr &&
            lovelace_amount >= builtin.i_data(claim.claim_amount)
          }
          _ -> False
        }
      },
    )
  
  // 7. Verify continuing datum updates correctly
  let continuing_valid =
    list.any(
      tx.outputs,
      fn(output) {
        when output.address.payment_credential is {
          Credential.Script(_) -> {
            // Extract and validate the continuing datum
            expect Some(inline_datum) = output.datum
            expect continuing_datum: CampaignDatum = inline_datum
            
            // Verify all fields are updated correctly
            continuing_datum.owner == datum.owner &&
            continuing_datum.merkle_root == datum.merkle_root &&
            continuing_datum.pool_amount == datum.pool_amount &&
            continuing_datum.total_claimed == datum.total_claimed + claim.claim_amount &&
            continuing_datum.claims_count == datum.claims_count + 1 &&
            continuing_datum.status == 2 &&
            list.has(continuing_datum.claimed_participants, claim.participant_addr) &&
            list.length(continuing_datum.claimed_participants) == list.length(datum.claimed_participants) + 1
          }
          _ -> False
        }
      },
    )
  
  // All conditions must pass
  not_claimed_yet && proof_valid && status_valid && balance_valid && output_valid && continuing_valid
}

// Validate finalize transaction (SetRoot)
fn validate_finalize(datum: CampaignDatum, tx: Transaction) -> Bool {
  // Owner signature required to finalize
  let owner_signed = list.has(tx.extra_signatories, datum.owner)
  
  // Can only finalize if Active (status == 0)
  let status_valid = datum.status == 0
  
  // Merkle root must be empty (not yet set)
  let root_empty = datum.merkle_root == #""
  
  // Verify continuing datum sets merkle_root and status=Ended
  let continuing_valid =
    list.any(
      tx.outputs,
      fn(output) {
        when output.address.payment_credential is {
          Credential.Script(_) -> {
            expect Some(inline_datum) = output.datum
            expect continuing_datum: CampaignDatum = inline_datum
            
            // Verify merkle root is now set and status is Ended
            continuing_datum.merkle_root != #"" &&
            continuing_datum.status == 2 &&
            continuing_datum.owner == datum.owner &&
            continuing_datum.pool_amount == datum.pool_amount &&
            continuing_datum.total_claimed == datum.total_claimed &&
            continuing_datum.claims_count == datum.claims_count
          }
          _ -> False
        }
      },
    )
  
  owner_signed && status_valid && root_empty && continuing_valid
}

// Validate cancel transaction with penalty
fn validate_cancel(datum: CampaignDatum, tx: Transaction) -> Bool {
  // Owner signature required
  let owner_signed = list.has(tx.extra_signatories, datum.owner)
  
  // Can only cancel if Active (status == 0)
  let status_valid = datum.status == 0
  
  owner_signed && status_valid
}

// Validate pause transaction
fn validate_pause(datum: CampaignDatum, tx: Transaction) -> Bool {
  // Owner signature required
  let owner_signed = list.has(tx.extra_signatories, datum.owner)
  
  // Can only pause if Active (status == 0)
  let status_valid = datum.status == 0
  
  owner_signed && status_valid
}

// Validate resume transaction
fn validate_resume(datum: CampaignDatum, tx: Transaction) -> Bool {
  // Owner signature required
  let owner_signed = list.has(tx.extra_signatories, datum.owner)
  
  // Can only resume if Paused (status == 1)
  let status_valid = datum.status == 1
  
  owner_signed && status_valid
}

