import { CONNECTION, RPC_READ_DELAY } from "./connection";
import { getKeysFromSecretKey } from "./keys";
import { logger } from "./logger";
import { createAdrenaProgram } from "./programs/adrena";
import { getUserStaking } from "./staking";
import { getUserTokens } from "./tokens";
import { wait } from "./utils";
import { NodeWallet } from "./wallet";

export async function initializeUserState(secretKeys: Array<string>) {
  return {
    users: await secretKeys.reduce(
      async (accP, secretKey) => {
        const acc = await accP;

        const keys = getKeysFromSecretKey(secretKey);
        logger.log("initializing user state ...", {
          publicKey: keys.public.base58,
        });

        const wallet = new NodeWallet(keys.keypairs.solana);

        acc[keys.public.base58] = {
          keys,
          wallet,
          program: createAdrenaProgram({ connection: CONNECTION, wallet }),
          tokens: await getUserTokens({
            connection: CONNECTION,
            publicKey: keys.public.key,
            publicKeyBuffer: keys.public.buffer,
          }),
          staking: await getUserStaking(keys.public.buffer),
        };

        await wait(RPC_READ_DELAY);

        return acc;
      },
      Promise.resolve({}) as Promise<
        Record<
          string,
          {
            keys: ReturnType<typeof getKeysFromSecretKey>;
            wallet: InstanceType<typeof NodeWallet>;
            program: ReturnType<typeof createAdrenaProgram>;
            tokens: Awaited<ReturnType<typeof getUserTokens>>;
            staking: Awaited<ReturnType<typeof getUserStaking>>;
          }
        >
      >,
    ),
  };
}
