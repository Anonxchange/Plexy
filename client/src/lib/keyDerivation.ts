import * as bip39 from 'bip39';

export async function mnemonicToSeed(mnemonic: string): Promise<Buffer> {
  return await bip39.mnemonicToSeed(mnemonic);
}
