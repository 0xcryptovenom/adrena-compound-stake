// biome-ignore lint/style/useImportType: <explanation>
import anchor from "@coral-xyz/anchor";
import BigNumber from "bignumber.js";

export function nativeToUi(nb: anchor.BN, decimals: number): number {
  return new BigNumber(nb.toString()).shiftedBy(-decimals).toNumber();
}
