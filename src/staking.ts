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
import { nativeToUi } from "./amount";
import { CONNECTION, RPC_READ_DELAY } from "./connection";
import { logger } from "./logger";
import { ADRENA_TOKENS, TOKENS } from "./tokens";
import { wait } from "./utils";

export const STAKING_ROUND_MIN_DURATION_SECONDS = 3_600 * 6;

export function getNextStakingRoundStartDate(timestampSeconds: number): Date {
  const d = new Date();
  d.setTime((timestampSeconds + STAKING_ROUND_MIN_DURATION_SECONDS) * 1_000);
  return d;
}

export const STAKING_STAKED_TOKENS = Object.freeze(
  ADRENA_TOKENS.reduce(
    (acc, token) => {
      const info = TOKENS[token];
      const stakingPda = getStakingPda(info.mint);
      const stakingPdaBuffer = stakingPda.toBuffer();

      return {
        // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
        ...acc,
        [token]: {
          name: token,
          stakingPda: {
            publicKey: stakingPda,
            buffer: stakingPdaBuffer,
          },
          stakingStakedTokenVaultPda:
            getStakingStakedTokenVaultPda(stakingPdaBuffer),
          stakingRewardTokenVaultPda:
            getStakingRewardTokenVaultPda(stakingPdaBuffer),
          stakingLmRewardTokenVaultPda:
            getStakingLmRewardTokenVaultPda(stakingPdaBuffer),
        },
      };
    },
    {} as {
      [T in (typeof ADRENA_TOKENS)[number]]: {
        name: T;
        stakingPda: {
          publicKey: PublicKey;
          buffer: Buffer;
        };
        stakingStakedTokenVaultPda: PublicKey;
        stakingRewardTokenVaultPda: PublicKey;
        stakingLmRewardTokenVaultPda: PublicKey;
      };
    },
  ),
);

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
  ...Object.keys(STAKING_STAKED_TOKENS),
] as const;

export function getUserStaking(publicKeyBuffer: Buffer) {
  return Object.keys(STAKING_STAKED_TOKENS).reduce(
    async (accP, _token) => {
      const acc = await accP;

      await wait(RPC_READ_DELAY);

      const token = _token as keyof typeof STAKING_STAKED_TOKENS;
      logger.log("initializing user staking ...", { token });

      const { decimals } = TOKENS[token];
      const stakingInfo = STAKING_STAKED_TOKENS[token];

      const userStakingPda = getUserStakingPda(
        publicKeyBuffer,
        stakingInfo.stakingPda.buffer,
      );
      const userStakingAccount =
        userStakingPda &&
        (await getUserStakingAccount(CONNECTION, userStakingPda));

      const liquidStakeAmountNative = userStakingAccount?.liquidStake.amount;

      return {
        ...acc,
        [token]: {
          name: token,
          userStakingPda,
          userStakingAccount,
          stakes: {
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
                if (curr.amount.isZero()) {
                  acc.stakes.empty.push(curr);
                } else {
                  acc.stakes.active.push(curr);
                }

                acc.total.amount.native =
                  acc.total.amount.native !== null
                    ? acc.total.amount.native.add(curr.amount)
                    : curr.amount;
                acc.total.amount.ui = nativeToUi(
                  acc.total.amount.native,
                  decimals,
                );

                return acc;
              },
              {
                stakes: { empty: [], active: [] },
                total: { amount: { native: null, ui: 0 } },
              } as {
                stakes: { empty: Array<unknown>; active: Array<unknown> };
                total: { amount: { native: anchor.BN | null; ui: number } };
              },
            ),
          },
        },
      };
    },
    Promise.resolve({}) as Promise<{
      [T in (typeof ADRENA_TOKENS)[number]]: {
        name: T;
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
            stakes: Array<unknown>;
            total: { amount: { native: anchor.BN | null; ui: number } };
          };
        };
      };
    }>,
  );
}
