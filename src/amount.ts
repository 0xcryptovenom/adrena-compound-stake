// biome-ignore lint/style/useImportType: <explanation>
import anchor from "@coral-xyz/anchor";
import BigNumber from "bignumber.js";

export function nativeToNumber(nb: anchor.BN): number {
  return new BigNumber(nb.toString()).toNumber();
}

export function nativeToUi(nb: anchor.BN, decimals: number): number {
  return new BigNumber(nb.toString()).shiftedBy(-decimals).toNumber();
}
