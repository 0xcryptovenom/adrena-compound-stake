import type { Wallet } from "@coral-xyz/anchor";
import {
  type Commitment,
  ComputeBudgetProgram,
  type Connection,
  type PublicKey,
  type SimulatedTransactionResponse,
  type Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { RPC_WRITE_DELAY } from "./connection";
import { logger } from "./logger";
import { DEFAULT_RPC_URL, SETTINGS } from "./settings";
import { wait } from "./utils";

export const DEFAULT_REBROADCAST_DELAY =
  SETTINGS.RPC_URL === DEFAULT_RPC_URL ? 15_000 : 5_000;
export const DEFAULT_REBROADCAST = true;
export const DEFAULT_MAX_RESIGNS = 0;

export const DEFAULT_SIMULATE = true;
export const DEFAULT_RESIMULATE = DEFAULT_SIMULATE;
export const RESIMULATE_DELAY = 100;
export const DEFAULT_MAX_RESIMULATE = 5;

export const SEND_OPTIONS = Object.freeze({
  skipPreflight: true,
});
export const SERIALIZE_CONFIG = Object.freeze({
  requireAllSignatures: false,
  verifySignatures: false,
});
export const SIMULATE_CONFIG = Object.freeze({
  sigVerify: false,
  commitment: "processed",
});
export const DEFAULT_COMMITMENT = "confirmed" as const;
export const TX_STATUS = Object.freeze({
  BROADCASTING: "broadcasting",
  CONFIRMED: "confirmed",
  FAILED: "failed",
} as const);
export type TX_STATUS = (typeof TX_STATUS)[keyof typeof TX_STATUS];

function runSimulateTransaction({
  connection,
  transaction,
  maxResimulate,
}: {
  connection: Connection;
  transaction: VersionedTransaction;
  maxResimulate: number;
}): Promise<SimulatedTransactionResponse> {
  logger.debug("Running transaction simulation ...", { maxResimulate });
  return connection
    .simulateTransaction(transaction, { ...SIMULATE_CONFIG })
    .then((result) => {
      if (result.value.err) {
        throw new Error("Transaction simulation failed", {
          cause: result.value.err,
        });
      }

      return result.value;
    })
    .catch(async (err) => {
      logger.error("Failed to simulate transaction!", err);

      if (err.message.includes("BlockhashNotFound") && maxResimulate > 0) {
        await wait(RESIMULATE_DELAY);
        return runSimulateTransaction({
          connection,
          transaction,
          maxResimulate: maxResimulate - 1,
        });
      }

      throw err;
    });
}

export async function customSimulateTransaction({
  payer,
  transaction,
  recentBlockhash,
  connection,
  maxResimulate,
}: {
  payer: PublicKey;
  transaction: Transaction;
  recentBlockhash: string;
  connection: Connection;
  maxResimulate: number;
}): Promise<SimulatedTransactionResponse> {
  return runSimulateTransaction({
    connection,
    transaction: new VersionedTransaction(
      new TransactionMessage({
        payerKey: payer,
        recentBlockhash,
        instructions: transaction.instructions,
      }).compileToV0Message(),
    ),
    maxResimulate,
  });
}

export async function sendAndConfirmTransaction({
  connection,
  transaction,
  wallet,
  options = {},
}: {
  connection: Connection;
  transaction: Transaction;
  wallet: Wallet;
  options?: {
    commitment?: Commitment;
    rebroadcast?: boolean;
    rebroadcastDelay?: number;
    maxResigns?: number;
    simulate?: boolean;
  };
}) {
  const {
    commitment = DEFAULT_COMMITMENT,
    rebroadcast = DEFAULT_REBROADCAST,
    rebroadcastDelay = DEFAULT_REBROADCAST_DELAY,
    maxResigns = DEFAULT_MAX_RESIGNS,
    simulate = DEFAULT_SIMULATE,
  } = options;

  const blockhashResponse = await connection.getLatestBlockhash(commitment);

  logger.debug("Fetched latest blockhash", { commitment, blockhashResponse });

  const lastValidBlockHeight = blockhashResponse.lastValidBlockHeight;

  transaction.recentBlockhash = blockhashResponse.blockhash;
  transaction.feePayer = wallet.publicKey;

  let simulationComputeUnits: number | null = null;

  if (simulate) {
    logger.log("Simulating transaction ...");
    try {
      const simulationResult = await customSimulateTransaction({
        payer: wallet.publicKey,
        transaction: transaction,
        recentBlockhash: blockhashResponse.blockhash,
        connection,
        maxResimulate: DEFAULT_RESIMULATE ? DEFAULT_MAX_RESIMULATE || 0 : 0,
      });

      simulationComputeUnits = simulationResult.unitsConsumed ?? null;
      logger.log("Ran transaction simulation", {
        simulationComputeUnits,
      });
      logger.debug(simulationResult);
    } catch (err) {
      logger.error(err);
    }
  }

  if (simulationComputeUnits !== null) {
    transaction.instructions[0] = ComputeBudgetProgram.setComputeUnitLimit({
      units: simulationComputeUnits * 1.05,
    });
  }

  const signed = await wallet.signTransaction(transaction);
  const serialized = signed.serialize(SERIALIZE_CONFIG);
  const signature = await connection.sendRawTransaction(
    serialized,
    rebroadcast
      ? {
          ...SEND_OPTIONS,
          maxRetries: 0,
        }
      : SEND_OPTIONS,
  );

  logger.debug("Sent transaction", { signature, lastValidBlockHeight });

  let blockHeight = await connection.getBlockHeight();
  let status = TX_STATUS.BROADCASTING as TX_STATUS;
  connection
    .confirmTransaction(
      {
        blockhash: blockhashResponse.blockhash,
        lastValidBlockHeight,
        signature,
      },
      commitment,
    )
    .then(
      (result) => {
        status = TX_STATUS.CONFIRMED;
        return result;
      },
      () => {
        status = TX_STATUS.FAILED;
      },
    );

  if (!rebroadcast) {
    return signature;
  }

  while (
    blockHeight < lastValidBlockHeight &&
    status === TX_STATUS.BROADCASTING
  ) {
    if (rebroadcastDelay) await wait(rebroadcastDelay);
    logger.debug("broadcasting transaction ...", {
      status,
      signature,
      blockHeight,
      lastValidBlockHeight,
    });
    connection.sendRawTransaction(serialized, SEND_OPTIONS).catch((err) => {
      logger.error("failed to broadcast transaction ...", { signature, err });
    });
    blockHeight = await connection.getBlockHeight();
  }

  await wait(RPC_WRITE_DELAY);

  status =
    status !== TX_STATUS.CONFIRMED ? TX_STATUS.FAILED : TX_STATUS.CONFIRMED;

  if (status === TX_STATUS.FAILED) {
    if (maxResigns > 0) {
      logger.log("Re-signing transaction ...", { maxResigns });
      return sendAndConfirmTransaction({
        connection,
        transaction,
        wallet,
        options: { ...options, maxResigns: maxResigns - 1 },
      });
    }

    throw new Error(`Failed to confirm transaction: ${signature}`);
  }

  logger.debug("Successfully confirmed transaction!", { signature });

  return signature;
}
