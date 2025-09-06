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
  LM_TOKEN_TREASURY,
  MAIN_POOL_PDA,
  TRANSFER_AUTHORITY_PDA,
  getGovernanceGoverningTokenOwnerRecordPda,
} from "../accounts";
import { type ADRENA_PROGRAM, ADRENA_PROGRAM_ID } from "../programs/adrena";
import { GOVERNANCE_PROGRAM_ID } from "../programs/governance";
import { STAKING_REWARD_LM_TOKEN_INFO, STAKING_STAKED_TOKEN } from "../staking";

export type BaseStakeMethodBuilderParams = {
  program: ADRENA_PROGRAM;
  userStakingPda: PublicKey;
  owner: PublicKey;
  ownerBuffer: Buffer;
  stakingRewardAta: PublicKey;
  stakingRewardLmAta: PublicKey;
  amount: anchor.BN;
};

export function makeAddLiquidADXStakeMethodBuilder({
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
    units: 500_000,
  });
  preInstructions.push(modifyComputeUnitsIx);

  const {
    stakingPda,
    stakingStakedTokenVaultPda,
    stakingRewardTokenVaultPda,
    stakingLmRewardTokenVaultPda,
  } = STAKING_STAKED_TOKEN;

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
      lmTokenTreasury: LM_TOKEN_TREASURY,
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

export function makeUpgradeLockedADXStakeMethodBuilder({
  program,
  userStakingPda,
  owner,
  ownerBuffer,
  stakingRewardAta,
  stakingRewardLmAta,
  amount,
  lockedStakeId,
}: BaseStakeMethodBuilderParams & {
  lockedStakeId: anchor.BN;
}) {
  const preInstructions: TransactionInstruction[] = [];
  const modifyComputeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 500_000,
  });
  preInstructions.push(modifyComputeUnitsIx);

  const {
    stakingPda,
    stakingStakedTokenVaultPda,
    stakingRewardTokenVaultPda,
    stakingLmRewardTokenVaultPda,
  } = STAKING_STAKED_TOKEN;

  return program.methods
    .upgradeLockedStake({
      amount,
      lockedStakeId,
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
      lmTokenTreasury: LM_TOKEN_TREASURY,
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
