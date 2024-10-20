import type { Wallet } from "@coral-xyz/anchor";
import { type Connection, PublicKey } from "@solana/web3.js";

import { CONNECTION } from "../connection.js";
import { createProgram, createReadOnlyProgram } from "./program.js";
import { IDL as THREAD_IDL } from "./thread.idl.js";

export const SABLIER_THREAD_PROGRAM_ID = new PublicKey(
  THREAD_IDL.metadata.address,
);

export function createSablierThreadProgram({
  connection,
  wallet,
}: {
  connection: Connection;
  wallet: Wallet;
}) {
  return createProgram({
    connection,
    wallet,
    idl: THREAD_IDL,
    programId: SABLIER_THREAD_PROGRAM_ID,
  });
}

export function createReadOnlySablierThreadProgram(connection: Connection) {
  return createReadOnlyProgram({
    connection,
    idl: THREAD_IDL,
    programId: SABLIER_THREAD_PROGRAM_ID,
  });
}

export const READ_ONLY_SABLIER_THREAD_PROGRAM =
  createReadOnlySablierThreadProgram(CONNECTION);

export type SABLIER_THREAD_PROGRAM = ReturnType<
  typeof createSablierThreadProgram
>;
