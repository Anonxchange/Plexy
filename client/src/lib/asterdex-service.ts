// ═══════════════════════════════════════════════════════════════════════════════
// PATCH for: src/lib/asterdex-service.ts
// ═══════════════════════════════════════════════════════════════════════════════
//
// STEP 1 — Add these two imports at the very top of the file, after the existing ones:
//
//   import { mnemonicToSeed } from "@scure/bip39";
//   import { HDKey } from "@scure/bip32";
//
// STEP 2 — Append the entire block below to the END of the file (after line 669).
// ═══════════════════════════════════════════════════════════════════════════════

// ── V3 Futures Agent Registration ─────────────────────────────────────────────
// AsterDEX V3 has TWO separate agent registrations:
//   1. sapi.asterdex.com/api/v3/createApiKey  → registers agent for SPOT endpoints
//   2. fapi.asterdex.com/fapi/v3/approveAgent → registers agent for FUTURES endpoints (/fapi/v3)
//
// Both must be called. The original code only called step 1, so futures endpoints
// returned {"code":-1000,"msg":"No agent found"}.
//
// approveAgent must be signed by the USER's main wallet (not the signer/agent key).

// ABI-encode helper: (string queryString, address user, address signer, uint256 nonce)
// This is the same format used by all /fapi/v3 signed requests.
function _abiEncodeApproveAgent(
  queryString: string,
  user: string,
  signer: string,
  nonce: bigint
): Uint8Array {
  function hexToBytes(hex: string): Uint8Array {
    const h = hex.replace('0x', '');
    const padded = h.length % 2 === 0 ? h : '0' + h;
    const b = new Uint8Array(padded.length / 2);
    for (let i = 0; i < padded.length; i += 2) b[i / 2] = parseInt(padded.slice(i, i + 2), 16);
    return b;
  }
  const enc = new TextEncoder();
  const strBytes = enc.encode(queryString);
  const paddedLen = Math.max(Math.ceil(strBytes.length / 32) * 32, 32);
  const paddedStr = new Uint8Array(paddedLen);
  paddedStr.set(strBytes);
  const u256 = (v: bigint) => hexToBytes(v.toString(16).padStart(64, '0'));
  const addr  = (a: string) => hexToBytes(a.toLowerCase().replace('0x', '').padStart(64, '0'));
  const chunks = [
    u256(128n),                          // offset to string data
    addr(user),                          // user address
    addr(signer),                        // signer address
    u256(nonce),                         // nonce
    u256(BigInt(strBytes.length)),       // string length
    paddedStr,                           // string data
  ];
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

// Register a signer wallet as a FUTURES trading agent on AsterDEX V3.
// Call this right after asterCreateApiKeyV3 during account setup.
// The mnemonic is used to sign the approval with the user's main wallet, then immediately wiped.
export async function asterApproveAgentFutures(
  mnemonic: string,
  userAddress: string,
  signerAddress: string,
): Promise<void> {
  // Derive main wallet private key (m/44'/60'/0'/0/0) — same path as evmSigner.ts
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive("m/44'/60'/0'/0/0");
  const privKey = child.privateKey!.slice(); // snapshot before wipe
  seed.fill(0);
  if (child.privateKey) child.privateKey.fill(0);

  try {
    const nonce = BigInt(Date.now()) * 1000n; // microseconds

    // Params for signing (must exclude: nonce, user, signer, signature)
    const signingParams = new URLSearchParams({
      agentAddress: signerAddress,
      agentName:    'pexly-v3',
      canSpotTrade: 'false',
      canPerpTrade: 'true',
      canWithdraw:  'false',
    });
    const queryString = signingParams.toString();

    // ABI-encode and sign — for registration the main wallet signs both user + signer slots
    const encoded  = _abiEncodeApproveAgent(queryString, userAddress, userAddress, nonce);
    const hash     = keccak_256(encoded);
    const sig      = secp.sign(hash, privKey, { lowS: true });
    const signature = '0x'
      + sig.r.toString(16).padStart(64, '0')
      + sig.s.toString(16).padStart(64, '0')
      + (sig.recovery! + 27).toString(16).padStart(2, '0');

    const body = new URLSearchParams({
      agentAddress: signerAddress,
      user:         userAddress,
      signer:       userAddress,  // main wallet signs its own registration
      nonce:        nonce.toString(),
      signature,
      agentName:    'pexly-v3',
      canSpotTrade: 'false',
      canPerpTrade: 'true',
      canWithdraw:  'false',
    });

    const res  = await fetch('https://fapi.asterdex.com/fapi/v3/approveAgent', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });
    const json = await res.json();
    if (!res.ok || (json.code !== undefined && json.code !== 0 && json.code !== 200)) {
      throw new Error(json.msg ?? 'Failed to approve futures agent: ' + JSON.stringify(json));
    }
  } finally {
    privKey.fill(0); // always wipe private key from memory
  }
}
