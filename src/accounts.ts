import anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";

import { COMMITMENT } from "./connection";
import { logger } from "./logger";
import { ADRENA_PROGRAM_ID, READ_ONLY_ADRENA_PROGRAM } from "./programs/adrena";
import {
  GOVERNANCE_PROGRAM_ID,
  GOVERNANCE_REALM_NAME,
} from "./programs/governance";
import { SABLIER_THREAD_PROGRAM_ID } from "./programs/thread";

export const TOKEN_PROGRAM_ID_BUFFER = TOKEN_PROGRAM_ID.toBuffer();
export const STAKING_STR_BUFFER = Buffer.from("staking");
export const USER_STAKING_STR_BUFFER = Buffer.from("user_staking");
export const STAKING_STAKED_TOKEN_VAULT_STR_BUFFER = Buffer.from(
  "staking_staked_token_vault",
);
export const STAKING_REWARD_TOKEN_VAULT_STR_BUFFER = Buffer.from(
  "staking_reward_token_vault",
);
export const STAKING_REWARD_LM_TOKEN_VAULT_STR_BUFFER = Buffer.from(
  "staking_lm_reward_token_vault",
);

export const getStakingPda = (stakedTokenMint: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [STAKING_STR_BUFFER, stakedTokenMint.toBuffer()],
    ADRENA_PROGRAM_ID,
  )[0];
};

export const getUserStakingPda = (
  ownerBuffer: Buffer,
  stakingPdaBuffer: Buffer,
) => {
  return PublicKey.findProgramAddressSync(
    [USER_STAKING_STR_BUFFER, ownerBuffer, stakingPdaBuffer],
    ADRENA_PROGRAM_ID,
  )[0];
};

export const getStakingStakedTokenVaultPda = (stakingPdaBuffer: Buffer) => {
  return PublicKey.findProgramAddressSync(
    [STAKING_STAKED_TOKEN_VAULT_STR_BUFFER, stakingPdaBuffer],
    ADRENA_PROGRAM_ID,
  )[0];
};

export const getStakingRewardTokenVaultPda = (stakingPdaBuffer: Buffer) => {
  return PublicKey.findProgramAddressSync(
    [STAKING_REWARD_TOKEN_VAULT_STR_BUFFER, stakingPdaBuffer],
    ADRENA_PROGRAM_ID,
  )[0];
};

export const getStakingLmRewardTokenVaultPda = (stakingPdaBuffer: Buffer) => {
  return PublicKey.findProgramAddressSync(
    [STAKING_REWARD_LM_TOKEN_VAULT_STR_BUFFER, stakingPdaBuffer],
    ADRENA_PROGRAM_ID,
  )[0];
};

export const CORTEX_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from("cortex")],
  ADRENA_PROGRAM_ID,
)[0];

export const TRANSFER_AUTHORITY_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from("transfer_authority")],
  ADRENA_PROGRAM_ID,
)[0];

export const TRANSFER_AUTHORITY_PDA_BUFFER = TRANSFER_AUTHORITY_PDA.toBuffer();

export function isATAInitialized(connection: Connection, address: PublicKey) {
  return connection.getAccountInfo(address).then(Boolean);
}

export function getTokenAccountBalance(
  connection: Connection,
  ata: PublicKey,
): Promise<anchor.BN | null> {
  return connection
    .getTokenAccountBalance(ata)
    .then(({ value: { amount } }) => new anchor.BN(amount))
    .catch((err) => {
      logger.debug(err);
      return null;
    });
}

export const getUserStakingAccount = async (
  connection: Connection,
  userStakingPda: PublicKey,
) => {
  if (!(await isATAInitialized(connection, userStakingPda))) {
    return null;
  }
  return READ_ONLY_ADRENA_PROGRAM.account.userStaking.fetchNullable(
    userStakingPda,
    COMMITMENT,
  );
};

export function findATAAddressSync(
  ownerBuffer: Buffer,
  mintBuffer: Buffer,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [ownerBuffer, TOKEN_PROGRAM_ID_BUFFER, mintBuffer],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export const MAIN_POOL_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from("pool"), Buffer.from("main-pool")],
  ADRENA_PROGRAM_ID,
)[0];

export const [CORTEX /* MAIN_POOL */] = await Promise.all([
  READ_ONLY_ADRENA_PROGRAM.account.cortex.fetch(CORTEX_PDA),
  // READ_ONLY_ADRENA_PROGRAM.account.pool.fetch(MAIN_POOL_PDA),
]);

export const GENESIS_LOCK_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from("genesis_lock"), MAIN_POOL_PDA.toBuffer()],
  ADRENA_PROGRAM_ID,
)[0];

export const THREAD_STR_BUFFER = Buffer.from("thread");

export const getThreadAddressPda = (threadId: anchor.BN) => {
  return PublicKey.findProgramAddressSync(
    [
      THREAD_STR_BUFFER,
      TRANSFER_AUTHORITY_PDA_BUFFER,
      threadId.toArrayLike(Buffer, "le", 8),
    ],
    SABLIER_THREAD_PROGRAM_ID,
  )[0];
};

export const GOVERNANCE_TOKEN_MINT = PublicKey.findProgramAddressSync(
  [Buffer.from("governance_token_mint")],
  ADRENA_PROGRAM_ID,
)[0];

export const GOVERNANCE_TOKEN_MINT_BUFFER = GOVERNANCE_TOKEN_MINT.toBuffer();

export const GOVERNANCE_STR_BUFFER = Buffer.from("governance");

export const GOVERNANCE_REALM_PDA = PublicKey.findProgramAddressSync(
  [GOVERNANCE_STR_BUFFER, Buffer.from(GOVERNANCE_REALM_NAME)],
  GOVERNANCE_PROGRAM_ID,
)[0];

export const GOVERNANCE_REALM_PDA_BUFFER = GOVERNANCE_REALM_PDA.toBuffer();

export const GOVERNANCE_REALM_CONFIG_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from("realm-config"), GOVERNANCE_REALM_PDA_BUFFER],
  GOVERNANCE_PROGRAM_ID,
)[0];

export const GOVERNANCE_GOVERNING_TOKEN_HOLDING =
  PublicKey.findProgramAddressSync(
    [
      GOVERNANCE_STR_BUFFER,
      GOVERNANCE_REALM_PDA_BUFFER,
      GOVERNANCE_TOKEN_MINT_BUFFER,
    ],
    GOVERNANCE_PROGRAM_ID,
  )[0];

export const getGovernanceGoverningTokenOwnerRecordPda = (
  ownerBuffer: Buffer,
) => {
  return PublicKey.findProgramAddressSync(
    [
      GOVERNANCE_STR_BUFFER,
      GOVERNANCE_REALM_PDA_BUFFER,
      GOVERNANCE_TOKEN_MINT_BUFFER,
      ownerBuffer,
    ],
    GOVERNANCE_PROGRAM_ID,
  )[0];
};
