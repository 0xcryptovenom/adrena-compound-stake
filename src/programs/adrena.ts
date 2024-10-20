import type { Wallet } from "@coral-xyz/anchor";

import { type Connection, PublicKey } from "@solana/web3.js";

import { CONNECTION } from "../connection.js";
import { logger } from "../logger.js";
import { IDL as ADRENA_IDL } from "./adrena.idl.js";
import { createProgram, createReadOnlyProgram } from "./program.js";

export const ADRENA_PROGRAM_ID = new PublicKey(
  "13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet",
);

export function createAdrenaProgram({
  connection,
  wallet,
}: {
  connection: Connection;
  wallet: Wallet;
}) {
  logger.log("creating user-scoped Adrena Program ...");

  return createProgram({
    connection,
    wallet,
    idl: ADRENA_IDL,
    programId: ADRENA_PROGRAM_ID,
  });
}

export function createReadOnlyAdrenaProgram(connection: Connection) {
  logger.log("creating read-only Adrena Program ...");

  return createReadOnlyProgram({
    connection,
    idl: ADRENA_IDL,
    programId: ADRENA_PROGRAM_ID,
  });
}

export const READ_ONLY_ADRENA_PROGRAM = createReadOnlyAdrenaProgram(CONNECTION);

export type ADRENA_PROGRAM = ReturnType<typeof createAdrenaProgram>;
