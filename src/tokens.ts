import anchor from "@coral-xyz/anchor";

import { NATIVE_MINT } from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";

import { findATAAddressSync, getTokenAccountBalance } from "./accounts";
import { nativeToUi } from "./amount";
import { RPC_READ_DELAY } from "./connection";
import { logger } from "./logger";
import type { Mutable } from "./types";
import { wait } from "./utils";

export const ADRENA_TOKENS = Object.freeze(["ALP", "ADX"] as const);

export const TOKENS = Object.freeze({
  ALP: ((mint) => ({
    name: "ALP" as const satisfies (typeof ADRENA_TOKENS)[number],
    mint,
    mintBuffer: mint.toBuffer(),
    decimals: 6,
  }))(new PublicKey("4yCLi5yWGzpTWMQ1iWHG5CrGYAdBkhyEdsuSugjDUqwj")),
  ADX: ((mint) => ({
    name: "ADX" as const satisfies (typeof ADRENA_TOKENS)[number],
    mint,
    mintBuffer: mint.toBuffer(),
    decimals: 6,
  }))(new PublicKey("AuQaustGiaqxRvj2gtCdrd22PBzTn8kM3kEPEkZCtuDw")),
  USDC: ((mint) => ({
    name: "USDC" as const,
    mint,
    mintBuffer: mint.toBuffer(),
    decimals: 6,
  }))(new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")),
  SOL: {
    name: "SOL" as const,
    mint: NATIVE_MINT,
    mintBuffer: NATIVE_MINT.toBuffer(),
    decimals: 9,
  },
});

async function getUserToken<T extends keyof typeof TOKENS>({
  connection,
  publicKey,
  publicKeyBuffer,
  mintBuffer,
  token,
  decimals,
}: {
  connection: Connection;
  publicKey: PublicKey;
  publicKeyBuffer: Buffer;
  token: T;
  mintBuffer: Buffer;
  decimals: number;
}) {
  logger.debug("initializing user token ...", { token });

  const ata = findATAAddressSync(publicKeyBuffer, mintBuffer);
  let balanceNative = await getTokenAccountBalance(connection, ata);

  if (token === "SOL") {
    balanceNative = balanceNative ?? new anchor.BN(0);
    const solBalanceUi = await connection.getBalance(publicKey);
    balanceNative.iadd(new anchor.BN(solBalanceUi));
  }

  return {
    name: token,
    ata,
    balance: {
      native: balanceNative,
      ui: balanceNative !== null ? nativeToUi(balanceNative, decimals) : 0,
    },
  };
}

export async function getUserTokens({
  connection,
  publicKey,
  publicKeyBuffer,
}: {
  connection: Connection;
  publicKey: PublicKey;
  publicKeyBuffer: Buffer;
}) {
  logger.log("initializing user tokens ...", { tokens: Object.keys(TOKENS) });

  return Object.entries(TOKENS).reduce(
    async (accP, [token, { mintBuffer, decimals }]) => {
      const acc = await accP;

      await wait(RPC_READ_DELAY);

      return {
        ...acc,
        [token]: await getUserToken({
          connection,
          publicKey,
          publicKeyBuffer,
          token: token as keyof typeof TOKENS,
          mintBuffer,
          decimals,
        }),
      };
    },
    Promise.resolve({}) as Promise<{
      [T in keyof Mutable<typeof TOKENS>]: Awaited<
        ReturnType<typeof getUserToken>
      >;
    }>,
  );
}
