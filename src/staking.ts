import type anchor from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";

import {
  getStakingLmRewardTokenVaultPda,
  getStakingPda,
  getStakingRewardTokenVaultPda,
  getStakingStakedTokenVaultPda,
  getUserStakingAccount,
  getUserStakingPda,
} from "./accounts";
import { nativeToNumber, nativeToUi } from "./amount";
import { CONNECTION, RPC_READ_DELAY } from "./connection";
import { logger } from "./logger";
import { type ADRENA_TOKENS, TOKENS } from "./tokens";
import { wait } from "./utils";

export const STAKING_ROUND_MIN_DURATION_SECONDS = 3_600 * 6;

export function getNextStakingRoundStartDate(timestampSeconds: number): Date {
  const d = new Date();
  d.setTime((timestampSeconds + STAKING_ROUND_MIN_DURATION_SECONDS) * 1_000);
  return d;
}

export const STAKING_STAKE_TOKEN_NAME =
  "ADX" as const satisfies (typeof ADRENA_TOKENS)[number];

export const STAKING_STAKED_TOKEN = (() => {
  const info = TOKENS[STAKING_STAKE_TOKEN_NAME];
  const stakingPda = getStakingPda(info.mint);
  const stakingPdaBuffer = stakingPda.toBuffer();

  return {
    name: STAKING_STAKE_TOKEN_NAME,
    stakingPda: {
      publicKey: stakingPda,
      buffer: stakingPdaBuffer,
    },
    stakingStakedTokenVaultPda: getStakingStakedTokenVaultPda(stakingPdaBuffer),
    stakingRewardTokenVaultPda: getStakingRewardTokenVaultPda(stakingPdaBuffer),
    stakingLmRewardTokenVaultPda:
      getStakingLmRewardTokenVaultPda(stakingPdaBuffer),
  } as const;
})();

export const STAKING_REWARD_TOKEN = "USDC" as const;
export const STAKING_REWARD_TOKEN_INFO = TOKENS[STAKING_REWARD_TOKEN];
export const STAKING_REWARD_LM_TOKEN = "ADX" as const;
export const STAKING_REWARD_LM_TOKEN_INFO = TOKENS[STAKING_REWARD_LM_TOKEN];
export const STAKING_REWARD_TOKENS = [
  STAKING_REWARD_TOKEN,
  STAKING_REWARD_LM_TOKEN,
] as const;
export const STAKING_RELEVANT_TOKENS = [
  STAKING_REWARD_TOKEN,
  STAKING_STAKE_TOKEN_NAME,
] as const;

export const MAX_LOCK_DURATION_DAYS = 540;
export const ONE_DAY_SECONDS = 3_600 * 24;

export async function getUserStaking(publicKeyBuffer: Buffer) {
  await wait(RPC_READ_DELAY);

  logger.log("initializing user staking ...", {
    token: STAKING_STAKE_TOKEN_NAME,
  });

  const { decimals } = TOKENS[STAKING_STAKE_TOKEN_NAME];
  const stakingInfo = STAKING_STAKED_TOKEN;

  const userStakingPda = getUserStakingPda(
    publicKeyBuffer,
    stakingInfo.stakingPda.buffer,
  );
  const userStakingAccount =
    userStakingPda && (await getUserStakingAccount(CONNECTION, userStakingPda));

  const liquidStakeAmountNative = userStakingAccount?.liquidStake
    .amount as anchor.BN | null;

  const stakes = {
    liquid: {
      amount: {
        native: liquidStakeAmountNative,
        ui:
          liquidStakeAmountNative !== null
            ? nativeToUi(liquidStakeAmountNative, decimals)
            : 0,
      },
    },
    locked: (userStakingAccount?.lockedStakes ?? []).reduce(
      (acc, curr) => {
        const item = {
          ...curr,
          amountUi: nativeToUi(curr.amount, decimals),
          lockDurationDays: nativeToNumber(curr.lockDuration) / ONE_DAY_SECONDS,
        };

        if (item.amount === 0) {
          acc.empty.push(item);
        } else {
          if (item.lockDurationDays === MAX_LOCK_DURATION_DAYS) {
            acc.active.maxLocked.push(item);
          }
          acc.active.other.push(item);

          acc.active.maxLocked.sort(
            (a: { amountUi: number }, b: { amountUi: number }) =>
              a.amountUi - b.amountUi,
          );
          acc.active.other.sort(
            (
              a: { lockDurationDays: number },
              b: { lockDurationDays: number },
            ) => b.lockDurationDays - a.lockDurationDays,
          );
        }

        acc.amount.native =
          acc.amount.native !== null
            ? acc.amount.native.add(curr.amount)
            : curr.amount;
        acc.amount.ui = nativeToUi(acc.amount.native, decimals);

        return acc;
      },
      {
        empty: [],
        active: { maxLocked: [], other: [] },
        amount: { native: null, ui: 0 },
      } as {
        empty: Array<unknown>;
        active: { maxLocked: Array<unknown>; other: Array<unknown> };
        amount: { native: anchor.BN | null; ui: number };
      },
    ),
  };

  logger.log("initialized user stakes!", {
    token: STAKING_STAKE_TOKEN_NAME,
    stakes: {
      liquid: stakes.liquid.amount.ui > 0,
      locked:
        stakes.locked.active.maxLocked.length +
        stakes.locked.active.other.length,
      maxLocked: stakes.locked.active.maxLocked.length,
      lowestAmountMaxLockedAmount:
        stakes.locked.active.maxLocked[0]?.amountUi ?? null,
    },
  });

  //      console.log(
  //        stakes.locked.active.maxLocked.map((stake: { [x: string]: any }) =>
  //          [
  //            "stakeTime",
  //            "claimTime",
  //            "endTime",
  //            "amountWithRewardMultiplier",
  //            "amountWithLmRewardMultiplier",
  //            "lockDuration",
  //            "lockDurationDays",
  //            "amountUi"
  //          ].map((prop) => ({ [prop]: nativeToNumber(stake[prop]) }))
  //        )
  //      );

  return {
    name: STAKING_STAKE_TOKEN_NAME,
    userStakingPda,
    userStakingAccount,
    stakes,
  } as {
    name: typeof STAKING_STAKE_TOKEN_NAME;
    userStakingPda: PublicKey;
    userStakingAccount: Awaited<ReturnType<typeof getUserStakingAccount>>;
    stakes: {
      liquid: {
        amount: {
          native: anchor.BN | null;
          ui: number;
        };
      };
      locked: {
        empty: Array<unknown>;
        active: { maxLocked: Array<unknown>; other: Array<unknown> };
        amount: { native: anchor.BN | null; ui: number };
      };
    };
  };
}
