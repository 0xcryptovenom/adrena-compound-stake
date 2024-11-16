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
  MAIN_POOL_PDA,
  TRANSFER_AUTHORITY_PDA,
} from "../accounts";
import { type ADRENA_PROGRAM, ADRENA_PROGRAM_ID } from "../programs/adrena";
import {
  STAKING_REWARD_LM_TOKEN_INFO,
  STAKING_STAKED_TOKENS,
} from "../staking";
import type { ADRENA_TOKENS } from "../tokens";

export function makeClaimStakesMethodBuilder(
  program: ADRENA_PROGRAM,
  stakedToken: (typeof ADRENA_TOKENS)[number],
  userStakingPda: PublicKey,
  owner: PublicKey,
  stakingRewardAta: PublicKey,
  stakingRewardLmAta: PublicKey,
) {
  const preInstructions: TransactionInstruction[] = [];

  const modifyComputeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 250_000,
  });

  preInstructions.push(modifyComputeUnitsIx);

  const {
    stakingPda,
    stakingRewardTokenVaultPda,
    stakingLmRewardTokenVaultPda,
  } = STAKING_STAKED_TOKENS[stakedToken];

  const accounts = {
    caller: owner,
    payer: owner,
    owner,
    rewardTokenAccount: stakingRewardAta,
    lmTokenAccount: stakingRewardLmAta,
    stakingRewardTokenVault: stakingRewardTokenVaultPda,
    stakingLmRewardTokenVault: stakingLmRewardTokenVaultPda,
    transferAuthority: TRANSFER_AUTHORITY_PDA,
    userStaking: userStakingPda,
    staking: stakingPda.publicKey,
    cortex: CORTEX_PDA,
    lmTokenMint: STAKING_REWARD_LM_TOKEN_INFO.mint,
    adrenaProgram: ADRENA_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    feeRedistributionMint: CORTEX.feeRedistributionMint,
    pool: MAIN_POOL_PDA,
    genesisLock: GENESIS_LOCK_PDA,
  };

  return program.methods
    .claimStakes({
      lockedStakeIndexes: null,
    })
    .accounts(accounts)
    .preInstructions(preInstructions);
}
