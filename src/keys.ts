import { readFileSync } from "node:fs";

import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

export function initSecretKeysFromFile(walletSecretKeysFilePath: string) {
  const secretKeys: Array<string> = [];

  try {
    const secretKeysFile = readFileSync(walletSecretKeysFilePath, "utf-8");
    for (const secretKeyLine of secretKeysFile.split("\n")) {
      const secretKey = secretKeyLine.trim();
      if (secretKey.startsWith("#")) continue;
      secretKeys.push(secretKey);
    }
  } catch (err) {
    throw new Error(
      `Unable to init wallet secret keys from secret keys file with path: ${walletSecretKeysFilePath}`,
      { cause: err },
    );
  }

  return secretKeys;
}

export function getKeysFromSecretKey(secretKey: string) {
  const ed25519Keypair = nacl.sign.keyPair.fromSecretKey(
    bs58.decode(secretKey),
  );
  const solanaKeypair = new Keypair(ed25519Keypair);
  const publicKeyBase58 = bs58.encode(ed25519Keypair.publicKey);
  const publicKey = new PublicKey(publicKeyBase58);

  return Object.freeze({
    keypairs: {
      ed25519: ed25519Keypair,
      solana: solanaKeypair,
    },
    public: {
      key: publicKey,
      base58: publicKeyBase58,
      buffer: publicKey.toBuffer(),
    },
  });
}
