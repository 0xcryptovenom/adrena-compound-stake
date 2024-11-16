import type anchor from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  type PublicKey,
  SystemProgram,
  type TransactionInstruction,
} from "@solana/web3.js";

import {
  CORTEX,
  CORTEX_PDA,
  GENESIS_LOCK_PDA,
  GOVERNANCE_GOVERNING_TOKEN_HOLDING,
  GOVERNANCE_REALM_CONFIG_PDA,
  GOVERNANCE_REALM_PDA,
  GOVERNANCE_TOKEN_MINT,
  MAIN_POOL_PDA,
  TRANSFER_AUTHORITY_PDA,
  getGovernanceGoverningTokenOwnerRecordPda,
} from "../accounts";
import { type ADRENA_PROGRAM, ADRENA_PROGRAM_ID } from "../programs/adrena";
import { GOVERNANCE_PROGRAM_ID } from "../programs/governance";
import {
  STAKING_REWARD_LM_TOKEN_INFO,
  STAKING_STAKED_TOKENS,
} from "../staking";

export type BaseStakeMethodBuilderParams = {
  program: ADRENA_PROGRAM;
  userStakingPda: PublicKey;
  owner: PublicKey;
  ownerBuffer: Buffer;
  stakingRewardAta: PublicKey;
  stakingRewardLmAta: PublicKey;
  amount: anchor.BN;
};

export async function makeAddLiquidADXStakeMethodBuilder({
  program,
  userStakingPda,
  owner,
  ownerBuffer,
  stakingRewardAta,
  stakingRewardLmAta,
  amount,
}: BaseStakeMethodBuilderParams) {
  const preInstructions: TransactionInstruction[] = [];
  const modifyComputeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 250_000,
  });
  preInstructions.push(modifyComputeUnitsIx);

  const {
    stakingPda,
    stakingStakedTokenVaultPda,
    stakingRewardTokenVaultPda,
    stakingLmRewardTokenVaultPda,
  } = STAKING_STAKED_TOKENS.ADX;

  return program.methods
    .addLiquidStake({
      amount,
    })
    .accountsStrict({
      owner,
      fundingAccount: stakingRewardLmAta,
      rewardTokenAccount: stakingRewardAta,
      lmTokenAccount: stakingRewardLmAta,
      stakingStakedTokenVault: stakingStakedTokenVaultPda,
      stakingRewardTokenVault: stakingRewardTokenVaultPda,
      stakingLmRewardTokenVault: stakingLmRewardTokenVaultPda,
      transferAuthority: TRANSFER_AUTHORITY_PDA,
      userStaking: userStakingPda,
      staking: stakingPda.publicKey,
      cortex: CORTEX_PDA,
      lmTokenMint: STAKING_REWARD_LM_TOKEN_INFO.mint,
      governanceTokenMint: GOVERNANCE_TOKEN_MINT,
      governanceRealm: GOVERNANCE_REALM_PDA,
      governanceRealmConfig: GOVERNANCE_REALM_CONFIG_PDA,
      governanceGoverningTokenHolding: GOVERNANCE_GOVERNING_TOKEN_HOLDING,
      governanceGoverningTokenOwnerRecord:
        getGovernanceGoverningTokenOwnerRecordPda(ownerBuffer),
      governanceProgram: GOVERNANCE_PROGRAM_ID,
      adrenaProgram: ADRENA_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      feeRedistributionMint: CORTEX.feeRedistributionMint,
      pool: MAIN_POOL_PDA,
      genesisLock: GENESIS_LOCK_PDA,
    })
    .preInstructions(preInstructions);
}

export async function makeUpgradeLockedADXStakeMethodBuilder({
  program,
  userStakingPda,
  owner,
  ownerBuffer,
  stakingRewardAta,
  stakingRewardLmAta,
  stakeResolutionThreadId,
  amount,
}: BaseStakeMethodBuilderParams & {
  stakeResolutionThreadId: anchor.BN;
}) {
  const preInstructions: TransactionInstruction[] = [];
  const modifyComputeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 250_000,
  });
  preInstructions.push(modifyComputeUnitsIx);

  const {
    stakingPda,
    stakingStakedTokenVaultPda,
    stakingRewardTokenVaultPda,
    stakingLmRewardTokenVaultPda,
  } = STAKING_STAKED_TOKENS.ADX;

  return program.methods
    .upgradeLockedStake({
      stakeResolutionThreadId: stakeResolutionThreadId,
      amount,
      lockedDays: null,
    })
    .accountsStrict({
      owner,
      fundingAccount: stakingRewardLmAta,
      rewardTokenAccount: stakingRewardAta,
      lmTokenAccount: stakingRewardLmAta,
      stakingStakedTokenVault: stakingStakedTokenVaultPda,
      stakingRewardTokenVault: stakingRewardTokenVaultPda,
      stakingLmRewardTokenVault: stakingLmRewardTokenVaultPda,
      transferAuthority: TRANSFER_AUTHORITY_PDA,
      userStaking: userStakingPda,
      staking: stakingPda.publicKey,
      cortex: CORTEX_PDA,
      lmTokenMint: STAKING_REWARD_LM_TOKEN_INFO.mint,
      governanceTokenMint: GOVERNANCE_TOKEN_MINT,
      governanceRealm: GOVERNANCE_REALM_PDA,
      governanceRealmConfig: GOVERNANCE_REALM_CONFIG_PDA,
      governanceGoverningTokenHolding: GOVERNANCE_GOVERNING_TOKEN_HOLDING,
      governanceGoverningTokenOwnerRecord:
        getGovernanceGoverningTokenOwnerRecordPda(ownerBuffer),
      governanceProgram: GOVERNANCE_PROGRAM_ID,
      adrenaProgram: ADRENA_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      feeRedistributionMint: CORTEX.feeRedistributionMint,
      pool: MAIN_POOL_PDA,
      genesisLock: GENESIS_LOCK_PDA,
    })
    .preInstructions(preInstructions);
}
