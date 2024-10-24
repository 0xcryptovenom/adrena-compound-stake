const envVarToBooleanDefaultFalse = (val: string | undefined) =>
  val !== undefined && ["1", "true"].includes(val);

const envVarToBooleanDefaultTrue = (val: string | undefined) =>
  val === undefined || ["1", "true"].includes(val);

const envVarRequired = (val: string | undefined, error: Error) => {
  if (!val) throw error;
  return val;
};

export const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";
export const DEFAULT_SCHEDULE_PING_INTERVAL_SECONDS = 10 * 60;

export const SETTINGS = {
  DEBUG: envVarToBooleanDefaultFalse(process.env.DEBUG),
  RESOLVE_STAKING_ROUNDS: envVarToBooleanDefaultTrue(
    process.env.RESOLVE_STAKING_ROUNDS,
  ),
  RPC_URL: process.env.RPC_URL || DEFAULT_RPC_URL,
  RUN_CURRENT_ROUND: envVarToBooleanDefaultTrue(process.env.RUN_CURRENT_ROUND),
  SCHEDULE_NEXT_ROUNDS: envVarToBooleanDefaultTrue(
    process.env.SCHEDULE_NEXT_ROUNDS,
  ),
  CLAIM_REWARDS: envVarToBooleanDefaultTrue(process.env.CLAIM_REWARDS),
  UPGRADE_MAX_LOCKED_ADX_STAKE: envVarToBooleanDefaultFalse(
    process.env.UPGRADE_MAX_LOCKED_ADX_STAKE,
  ),
  SCHEDULE_PING_INTERVAL_SECONDS:
    Number(process.env.DEFAULT_SCHEDULE_PING_INTERVAL_SECONDS) ||
    DEFAULT_SCHEDULE_PING_INTERVAL_SECONDS,
  WALLET_SECRET_KEYS_FILE_PATH: envVarRequired(
    process.env.WALLET_SECRET_KEYS_FILE_PATH,
    new Error(
      "Please provide WALLET_SECRET_KEYS_FILE_PATH=/abs/path/to/secret/keys/file",
    ),
  ),
};
