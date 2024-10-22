import type { Wallet } from "@coral-xyz/anchor";
import type { Connection, Transaction } from "@solana/web3.js";

import { logger } from "./logger";
import { wait } from "./utils";
import { DEFAULT_RPC_URL, SETTINGS } from "./settings";
import { RPC_WRITE_DELAY } from "./connection";

export const REBROADCAST_POLLING_DELAY =
  SETTINGS.RPC_URL === DEFAULT_RPC_URL ? 15_000 : 5_000;
export const DEFAULT_REBROADCAST = true;
export const DEFAULT_MAX_RESIGNS = 5;

export const SEND_OPTIONS = Object.freeze({
  skipPreflight: true,
});
export const COMMITMENT = "confirmed" as const;

export async function customSendAndConfirmTransaction({
  connection,
  transaction,
  wallet,
  options = {},
}: {
  connection: Connection;
  transaction: Transaction;
  wallet: Wallet;
  options?: { rebroadcast?: boolean; maxResigns?: number };
}) {
  const {
    maxResigns = DEFAULT_MAX_RESIGNS,
    rebroadcast = DEFAULT_REBROADCAST,
  } = options;

  const blockhashResponse = await connection.getLatestBlockhash(COMMITMENT);

  logger.debug("Fetched latest blockhash", { COMMITMENT, blockhashResponse });

  const lastValidBlockHeight = blockhashResponse.lastValidBlockHeight - 150;

  transaction.recentBlockhash = blockhashResponse.blockhash;
  transaction.feePayer = wallet.publicKey;

  const signed = await wallet.signTransaction(transaction);
  const serialized = signed.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const signature = await connection.sendRawTransaction(
    serialized,
    SEND_OPTIONS
  );

  logger.debug("Sent transaction", { signature, lastValidBlockHeight });

  let blockHeight = await connection.getBlockHeight();
  let status = "broadcasting";
  connection
    .confirmTransaction({
      blockhash: blockhashResponse.blockhash,
      lastValidBlockHeight,
      signature,
    })
    .then(
      (result) => {
        status = "confirmed";
        return result;
      },
      () => {
        status = "failed";
      }
    );

  if (!rebroadcast) {
    return signature;
  }

  while (blockHeight < lastValidBlockHeight && status !== "confirmed") {
    await wait(REBROADCAST_POLLING_DELAY);
    logger.debug("sneding ...", {
      signature,
      blockHeight,
      lastValidBlockHeight,
    });
    connection.sendRawTransaction(serialized, SEND_OPTIONS);
    blockHeight = await connection.getBlockHeight();
  }

  await wait(RPC_WRITE_DELAY);

  status = status !== "confirmed" ? "failed" : "confirmed";

  if (status === "failed") {
    logger.error("Sneding transaction failed", { signature });
    if (maxResigns > 0) {
      logger.log("Re-signing ...");
      return await customSendAndConfirmTransaction({
        connection,
        transaction,
        wallet,
        options: { maxResigns: maxResigns - 1 },
      });
    }

    throw new Error(`Failed to confirm transaction: ${signature}`);
  }

  logger.debug("Successfully confirmed transaction!", { signature });

  return signature;
}
