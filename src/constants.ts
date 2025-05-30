export const RATE_DECIMALS = 9;
export const PRICE_DECIMALS = 10;
export const USD_DECIMALS = 6;
export const LP_DECIMALS = 6;
export const SOL_DECIMALS = 9;

export const BPS = 10_000;

export const GENESIS_REWARD_ADX_PER_USDC = 5;

export const ADX_STAKE_MULTIPLIERS = Object.freeze({
  0: {
    USDC: 1,
    ADX: 0,
    votes: 1,
  },
  90: {
    USDC: 1.75,
    ADX: 1.0,
    votes: 1.75,
  },
  180: {
    USDC: 2.5,
    ADX: 1.75,
    votes: 2.5,
  },
  360: {
    USDC: 3.25,
    ADX: 2.5,
    votes: 3.25,
  },
  540: {
    USDC: 4.0,
    ADX: 3.25,
    votes: 4.0,
  },
} as const);
export const ADX_LOCK_PERIODS = Object.freeze(
  Object.keys(
    ADX_STAKE_MULTIPLIERS,
  ) as unknown as keyof typeof ADX_STAKE_MULTIPLIERS,
);

export const ROUND_MIN_DURATION_SECONDS = 3_600 * 6;
