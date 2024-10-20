import { Connection } from "@solana/web3.js";
import { DEFAULT_RPC_URL, SETTINGS } from "./settings";

export const RPC_URL = SETTINGS.RPC_URL;

export const COMMITMENT = "confirmed" as const;
export const CONNECTION = new Connection(RPC_URL, COMMITMENT);
export const RPC_READ_DELAY = RPC_URL === DEFAULT_RPC_URL ? 5_000 : 500;
export const RPC_WRITE_DELAY = RPC_URL === DEFAULT_RPC_URL ? 10_000 : 1_000;

export const CONFIRM_OPTIONS = Object.freeze({
  commitment: COMMITMENT,
  skipPreflight: true,
});
