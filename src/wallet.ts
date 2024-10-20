// necessary to properly import anchor bullshit NodeWallet.
// @ts-ignore
import { createRequire } from "node:module";

// anchor bullshit.
import type NodeWalletClassType from "@coral-xyz/anchor/dist/cjs/nodewallet.js";

import type { Class } from "./types.js";

// more anchor bullshit
const require = createRequire(import.meta.url);
export const NodeWallet = require("@coral-xyz/anchor/dist/cjs/nodewallet.js")
  .default as Class<NodeWalletClassType>;
