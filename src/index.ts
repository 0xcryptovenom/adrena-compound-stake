#!/usr/bin/env node

import { getTokenAccountBalance } from "./accounts.js";
import { nativeToUi } from "./amount.js";
import { CONNECTION, RPC_READ_DELAY, RPC_WRITE_DELAY } from "./connection.js";
import { makeClaimStakesMethodBuilder } from "./instructions/claim.js";
import { makeResolveStakingRoundMethodBuilder } from "./instructions/resolve-staking-round.js";
import { makeAddLiquidADXStakeMethodBuilder } from "./instructions/stake.js";
import { initSecretKeysFromFile } from "./keys.js";
import { logger } from "./logger.js";
import { READ_ONLY_ADRENA_PROGRAM } from "./programs/adrena.js";
import { SETTINGS } from "./settings.js";
import {
  STAKING_STAKED_TOKENS,
  getNextStakingRoundStartDate,
} from "./staking.js";
import { initializeUserState } from "./state.js";
import { TOKENS } from "./tokens.js";
import { customSendAndConfirmTransaction } from "./transaction.js";
import { wait } from "./utils.js";

process.on("SIGUSR2", () => {
  process.kill(process.pid, "SIGTERM");
});

logger.log("initialized constants & user settings", SETTINGS);

const secretKeys = initSecretKeysFromFile(
  SETTINGS.WALLET_SECRET_KEYS_FILE_PATH,
);

logger.log(
  `initializing user state for ${secretKeys.length} wallet secret keys ...`,
);

const state = await initializeUserState(secretKeys);

logger.log("initialized users state!", Object.keys(state.users));

await wait(RPC_READ_DELAY);

async function runForUser(user: (typeof state)["users"][string]) {
  for (const _stakedToken in STAKING_STAKED_TOKENS) {
    const stakedToken = _stakedToken as keyof typeof STAKING_STAKED_TOKENS;

    logger.log("running [resolve staking round] + claim iteration", {
      publicKey: user.keys.public.base58,
      stakedToken,
    });

    try {
      const claimTx = await makeClaimStakesMethodBuilder(
        user.program,
        stakedToken,
        user.staking[stakedToken].userStakingPda,
        user.keys.public.key,
        user.tokens.USDC.ata,
        user.tokens.ADX.ata,
      ).transaction();

      logger.log("sending claim transaction ...", {
        publicKey: user.keys.public.base58,
        stakedToken,
      });

      await customSendAndConfirmTransaction({
        connection: CONNECTION,
        transaction: claimTx,
        wallet: user.wallet,
      }).then((signature) => {
        logger.log("confirmed claim transaction!", {
          publicKey: user.keys.public.base58,
          stakedToken,
          signature,
        });
      });
    } catch (err) {
      logger.error("Failed to claim", { stakedToken, err });
    }

    await wait(RPC_WRITE_DELAY);
  }

  logger.log("[resolve staking round] + claim loop completed!");
  logger.log("checking ADX balance ...");
  const amount = await getTokenAccountBalance(CONNECTION, user.tokens.ADX.ata);
  logger.log("retrieved ADX token balance!", { amount });

  if (!!amount && !amount.isZero()) {
    try {
      const addLiquidADXStakeMethodBuilder =
        await makeAddLiquidADXStakeMethodBuilder(
          user.program,
          user.staking.ADX.userStakingPda,
          user.keys.public.key,
          user.keys.public.buffer,
          user.tokens.USDC.ata,
          user.tokens.ADX.ata,
          amount,
        );
      const stakeTx = await addLiquidADXStakeMethodBuilder.transaction();

      logger.log("sending liquid stake transaction ...", {
        publicKey: user.keys.public.base58,
        amount: nativeToUi(amount, TOKENS.ADX.decimals),
      });

      await customSendAndConfirmTransaction({
        connection: CONNECTION,
        transaction: stakeTx,
        wallet: user.wallet,
      }).then((signature) => {
        logger.log("confirmed stake transaction!", {
          publicKey: user.keys.public.base58,
          amount,
          signature,
        });
      });
    } catch (err) {
      logger.error("Failed to stake", { err });
    }
  } else {
    logger.log("empty ADX token balance, skipping ...", { amount });
  }
}

async function run(resolve = true, current = true, schedule = true) {
  logger.debug("running staking round threads checking loop");

  const nextRounds = (
    await Object.keys(STAKING_STAKED_TOKENS).reduce(
      async (accP, _stakedToken) => {
        const acc = await accP;

        const stakedToken = _stakedToken as keyof typeof STAKING_STAKED_TOKENS;

        logger.debug("running staking round threads checking iteration", {
          stakedToken,
        });

        const programFetchedStakingAccount =
          await READ_ONLY_ADRENA_PROGRAM.account.staking
            .fetch(STAKING_STAKED_TOKENS[stakedToken].stakingPda.publicKey)
            .catch((err) => {
              logger.error("failed to fetch program staking account", {
                stakedToken,
                err,
              });
              return null;
            });

        if (!programFetchedStakingAccount) {
          return acc;
        }

        const nextRoundStartDate = getNextStakingRoundStartDate(
          programFetchedStakingAccount.currentStakingRound.startTime.toNumber(),
        );

        const nextRound = { stakedToken, date: nextRoundStartDate };
        acc.push(nextRound);
        logger.log("next staking round start:", {
          stakedToken,
          date: nextRoundStartDate.toISOString(),
          localeTime: nextRoundStartDate.toLocaleTimeString(),
        });

        await wait(RPC_READ_DELAY);

        return acc;
      },
      Promise.resolve([]) as Promise<
        Array<{ stakedToken: keyof typeof STAKING_STAKED_TOKENS; date: Date }>
      >,
    )
  ).sort((a, b) => b.date.getTime() - a.date.getTime());

  const users = Object.values(state.users);
  if (!users.length) {
    logger.log("No users initialized in state, exiting.");
    return process.exit(0);
  }

  const now = new Date();
  let staleRounds = false;
  for (const round of nextRounds) {
    if (now > round.date) {
      staleRounds = true;
      logger.log(
        "encountered stale round which needs to be resolved before rewards can be claimed ...",
        {
          round,
          resolve,
        },
      );
      if (!resolve) {
        continue;
      }

      const user = users[0];
      logger.log(
        "should attempt resolving staking round for token with first available user ...",
        {
          publicKey: user.keys.public.base58,
          round,
        },
      );

      try {
        const resolveStakingRoundTx =
          await makeResolveStakingRoundMethodBuilder(
            user.program,
            round.stakedToken,
            user.keys.public.key,
          ).transaction();

        await customSendAndConfirmTransaction({
          connection: CONNECTION,
          transaction: resolveStakingRoundTx,
          wallet: user.wallet,
        }).then((signature) => {
          logger.log("sent resolve staking round transaction!", {
            round,
            signature,
          });
        });
      } catch (err) {
        logger.error("Failed to resolve staking round", { round, err });
      }

      await wait(RPC_WRITE_DELAY);
    }
  }

  if (staleRounds && resolve) {
    // We attempted to resolve stale rounds... Let's re-run.
    // We're only attempting to resolve stale rounds once.
    return run(false, true, schedule);
  }

  if (current) {
    for (const user of Object.values(state.users)) {
      await runForUser(user);
    }
  }

  if (schedule) {
    const farthestRound = nextRounds[0];
    if (!farthestRound) {
      logger.error("No next round found, exiting...");
      return;
    }

    const deltaMs = farthestRound.date.getTime() - Date.now();
    const deltaSeconds = deltaMs / 1_000;
    const deltaMinutes = deltaSeconds / 60;

    logger.log(
      "scheduling next run on farthest staking round with an included artificial delay",
      {
        farthestRound,
        deltaMs,
        deltaSeconds,
        deltaMinutes,
        now: new Date().toISOString(),
        nextRun: new Date(Date.now() + deltaMs).toISOString(),
      },
    );

    const SCHEDULE_PING_INTERVAL_MS = 10 * 60 * 1_000;
    let remaining = deltaMs;
    function schedulePingCheck() {
      remaining = farthestRound.date.getTime() - Date.now();
      logger.log("schedule ping check", {
        SCHEDULE_PING_INTERVAL_MS,
        remaining,
      });
      if (remaining > SCHEDULE_PING_INTERVAL_MS) {
        setTimeout(schedulePingCheck, SCHEDULE_PING_INTERVAL_MS);
        return;
      }
      setTimeout(run, remaining, SETTINGS.RESOLVE_STAKING_ROUNDS, true, true);
    }
    schedulePingCheck();
  }
}

run(
  SETTINGS.RESOLVE_STAKING_ROUNDS,
  SETTINGS.RUN_CURRENT_ROUND,
  SETTINGS.SCHEDULE_NEXT_ROUNDS,
);
