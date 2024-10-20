# Basic usage

## Install & build

```
npm install && npm run build
```

Developped on:

- Node.js v20.18.0
- npm 10.8.2
- Linux (Windows is most likely not going to work, Mac OS should work just fine)

## Resolve staking rounds + claim [+ stake] immediately + schedule claim + stake on next round

```
WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npm start
```

```
RESOLVE_STAKING_ROUNDS=1 RUN_CURRENT_ROUND=1 SCHEDULE_NEXT_ROUNDS=1 RPC_URL="https://mainnet.helius-rpc.com/?api-key=xxx" WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npm start
```

## Skip resolving of staking rounds + claim [+ stake] immediately + schedule claim + stake on next round

```
RESOLVE_STAKING_ROUNDS=0 RUN_CURRENT_ROUND=1 SCHEDULE_NEXT_ROUNDS=1 WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npm start
```

## Skip resolving of staking rounds + skip claim [+ stake] immediately + schedule claim + stake on next round

```
RESOLVE_STAKING_ROUNDS=0 RUN_CURRENT_ROUND=0 SCHEDULE_NEXT_ROUNDS=1 WALLET_SECRET_KEYS_FILE_PATH="/abs/path/to/secret/keys/file" npm start
```
