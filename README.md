# DISCLAIMER

This software is provided for educational purposes, **use at your own risk**.

# adrena-compound-stake [![npm](https://img.shields.io/npm/v/adrena-compound-stake)](https://www.npmjs.com/package/adrena-compound-stake)

# Compound (Claim + Stake) $ADX Liquidity Mining Rewards Every 6 Hours Automatically

[Adrena Protocol](https://www.adrena.xyz/)'s [$ADX](https://birdeye.so/token/AuQaustGiaqxRvj2gtCdrd22PBzTn8kM3kEPEkZCtuDw?chain=solana) [Liquidity Mining Rewards](https://docs.adrena.xyz/about-adrena/staking) can be claimed every 6hours.

In order to compound rewards efficiently, `$ADX` rewards must be claimed & **re-staked** every 6hours, at the end of each staking round.

This project aims at automating the compounding of `$ADX` liquidity mining rewards so that manually claiming & staking `$ADX` rewards every 6hours is not necessary, and missing some staking rounds is not as much of a penalty in terms of compounding rewards.

More precisely, the Node.js script / program has the following capabilities:

- check the start date of the next staking rounds (both `$ALP`'s & `$ADX`'s).
- sign & send a transaction using the first provided wallet secret key to resolve the current staking round if necessary.
- for all the provided user wallet secret keys (base58-encoded, ie: the format used when exporting from Phantom wallet):
  - schedule **claiming `$ADX` rewards + adding to `$ADX` liquid stake OR upgrading the lowest-amount max-locked stake** for both `$ADX` & `$ALP` staking rewards **to the farthest round start date & time**
  - _example: `$ALP` next round starts in 1hour, `$ADX` next round starts in 2hours, the script will schedule claim + stake in 2hours on the start of the next `$ADX` round_
  - claim + stake schedules have a integrated artifical delay amounting to a few minutes to preserve privacy.

# Basic usage

## Install or build from sources

### Install from the npm package registry

Install globally using npm:

```
npm i -g adrena-compound-stake
```

If you just want to give it a test run, you can use npx instead:

```
npx adrena-compound-stake
```

### Build from sources

If you don't want to install from npm, you can build this project from sources, after cloning the repository using git.

```
npm install && npm run build
```

Developped on:

- Node.js v20.18.0
- npm 10.8.2
- Linux (Windows is most likely not going to work, Mac OS should work just fine)

## User-provided Settings / Environment Variables

### `WALLET_SECRET_KEYS_FILE_PATH`

The absolute path to a text file containing one or multiple Solana wallet base58-encoded-string secret keys, one per line.
Secret keys can be commented-out / skipped / disabled by prefixing the secret key with a leading `#`.

Not providing this environment variable will cause the program to exit early in its initialization.

### `RPC_URL`

The URL to a Solana RPC, if none is provided, the default `"https://api.mainnet-beta.solana.com"` will be used instead.
Note: it is strongly recommended to provide a custom RPC, as the default one is severely rate-limited, and as a result, significant delay is added artificially between operations.

This project has been developped (and is being used!) with a free [Helius RPC for Solana](https://www.helius.dev/).

### `RUN_CURRENT_ROUND`

Whether or not the program should claim `$ADX` rewards + stake ~immediately (before the start of the next farthest round).
Useful when rewards haven't been claimed for the current round or for a while, in order to get back on track for compounding rewards.

This behavior is enabled by default.

### `SCHEDULE_NEXT_ROUNDS`

Whether or not the program should schedule the claim of `$ADX` rewards + stake at the start of the next farthest round.
The essence of this program.

This behavior is enabled by default.

### `RESOLVE_STAKING_ROUNDS`

Whether or not the program should attempt to resolve stale staking rounds when necessary.

This behavior is enabled by default.

### `CLAIM_REWARDS`

Whether or not the program should attempt claiming rewards when running the current round (only has an effect when `RUN_CURRENT_ROUND` is not disabled).

This behavior is enabled by default.

### `SCHEDULE_PING_INTERVAL_SECONDS`

The time interval in seconds, at which the program checks for the remaining time before the next scheduled round.
This interval is useful to improve reliability of the script when the program can be paused (ie: a laptop going to sleep) without adding an additional delay to the schedule.
On a stable server on the other hand, in order to not clutter logs unnecessarily, this value can be increased.

The default value is `10 * 60 = 600` seconds: 10minutes.

### `UPGRADE_MAX_LOCKED_ADX_STAKE`

Whether or not the program should use the available `$ADX` to upgrade the max-locked stake it can find at initialization, instead of adding to liquid stake.

This behavior is not enabled by default. In other words: by default the program adds to liquid stake, but with this option enabled, it will upgrade the max-locked (540days) stake with the lowest amount `$ADX` amount.

## Examples

### Resolve staking rounds + claim [+ stake] immediately + schedule claim + stake on next rounds

```bash
WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" adrena-compound-stake
# WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npx adrena-compound-stake
# WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npm start
```

```bash
RESOLVE_STAKING_ROUNDS=1 RUN_CURRENT_ROUND=1 SCHEDULE_NEXT_ROUNDS=1 RPC_URL="https://mainnet.helius-rpc.com/?api-key=xxx" WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npm start
# RESOLVE_STAKING_ROUNDS=1 RUN_CURRENT_ROUND=1 SCHEDULE_NEXT_ROUNDS=1 RPC_URL="https://mainnet.helius-rpc.com/?api-key=xxx" WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npx adrena-compound-stake
# RESOLVE_STAKING_ROUNDS=1 RUN_CURRENT_ROUND=1 SCHEDULE_NEXT_ROUNDS=1 RPC_URL="https://mainnet.helius-rpc.com/?api-key=xxx" WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" adrena-compound-stake
```

### Skip resolving of staking rounds + claim [+ stake] immediately + schedule claim + stake on next rounds

```bash
RESOLVE_STAKING_ROUNDS=0 RUN_CURRENT_ROUND=1 SCHEDULE_NEXT_ROUNDS=1 WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npm start
```

### Skip resolving of staking rounds + skip claim [+ stake] immediately + schedule claim + stake on next rounds

```bash
RESOLVE_STAKING_ROUNDS=0 RUN_CURRENT_ROUND=0 SCHEDULE_NEXT_ROUNDS=1 WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npm start
```

### Support

Please consider **supporting further development (like auto-upgrading the maximum locked stake)** of this project & [other contributions to benefit of the Adrena Community](https://github.com/0xcryptovenom) by donating to the following Solana address:

- `7LQXiKR6QmqmB3BwLFx6Q9o7BPxZ1DmJQoS8mtHf55fW`

Every `$ADX` donated counts (and will be staked ;) !

Alternatively, you can also follow me on Twitter:

- [`0xcryptov`](https://x.com/0xcryptov)

Thank you!
