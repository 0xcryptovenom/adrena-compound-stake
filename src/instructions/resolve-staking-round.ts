import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { type PublicKey, SystemProgram } from "@solana/web3.js";

import { CORTEX, CORTEX_PDA, TRANSFER_AUTHORITY_PDA } from "../accounts";
import { type ADRENA_PROGRAM, ADRENA_PROGRAM_ID } from "../programs/adrena";
import { STAKING_REWARD_LM_TOKEN_INFO, STAKING_STAKED_TOKEN } from "../staking";
import type { ADRENA_TOKENS } from "../tokens";

export function makeResolveStakingRoundMethodBuilder(
  program: ADRENA_PROGRAM,
  stakedToken: (typeof ADRENA_TOKENS)[number],
  payer: PublicKey,
) {
  const {
    stakingPda,
    stakingStakedTokenVaultPda,
    stakingRewardTokenVaultPda,
    stakingLmRewardTokenVaultPda,
  } = STAKING_STAKED_TOKEN;

  return program.methods.resolveStakingRound().accountsStrict({
    cortex: CORTEX_PDA,
    payer,
    transferAuthority: TRANSFER_AUTHORITY_PDA,
    feeRedistributionMint: CORTEX.feeRedistributionMint,
    lmTokenMint: STAKING_REWARD_LM_TOKEN_INFO.mint,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    caller: payer,
    adrenaProgram: ADRENA_PROGRAM_ID,
    staking: stakingPda.publicKey,
    stakingRewardTokenVault: stakingRewardTokenVaultPda,
    stakingLmRewardTokenVault: stakingLmRewardTokenVaultPda,
    stakingStakedTokenVault: stakingStakedTokenVaultPda,
  });
}
