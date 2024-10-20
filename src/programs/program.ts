import anchor from "@coral-xyz/anchor";
import type { Idl, Wallet } from "@coral-xyz/anchor";
import type { Connection, PublicKey } from "@solana/web3.js";

import { CONFIRM_OPTIONS } from "../connection.js";

export function createProgram<TIdl extends Idl>({
  connection,
  wallet,
  idl,
  programId,
}: {
  connection: Connection;
  wallet: Wallet;
  idl: TIdl;
  programId: PublicKey;
}) {
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    CONFIRM_OPTIONS,
  );
  return new anchor.Program(idl, programId, provider);
}

export function createReadOnlyProgram<TIdl extends Idl>({
  connection,
  idl,
  programId,
}: {
  connection: Connection;
  idl: TIdl;
  programId: PublicKey;
}) {
  const readOnlyProvider = new anchor.AnchorProvider(
    connection,
    {} as Wallet,
    CONFIRM_OPTIONS,
  );
  readOnlyProvider.wallet.signTransaction = async (x) => x;
  return new anchor.Program(idl, programId, readOnlyProvider);
}
