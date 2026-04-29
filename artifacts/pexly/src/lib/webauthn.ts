import { getSupabase } from './supabase';

export interface WebAuthnCredential {
  id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_name: string;
  credential_type: 'hardware_key' | 'passkey';
  created_at: string;
}

export interface PasskeySignInResult {
  tokenHash: string;
  email: string;
  userId: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

function edgeFunctionUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

async function callEdgeFunction(name: string, body: unknown, token?: string): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return fetch(edgeFunctionUrl(name), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

// ── base64url helpers ─────────────────────────────────────────────────────────

function base64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  const b64 = padded + '='.repeat(pad);
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

class WebAuthnService {
  async isSupported(): Promise<boolean> {
    return !!window.PublicKeyCredential;
  }

  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!await this.isSupported()) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  getDeviceName(): string {
    const ua = navigator.userAgent;
    let browser = 'Browser';
    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua)) browser = 'Safari';

    let os = 'Device';
    if (/iPhone/.test(ua)) os = 'iPhone';
    else if (/iPad/.test(ua)) os = 'iPad';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'Mac';
    else if (/Linux/.test(ua)) os = 'Linux';

    return `${browser} on ${os}`;
  }

  // ── Registration (server-side challenge + verification) ─────────────────────

  async register(userId: string, deviceName: string): Promise<void> {
    await this._registerWithEdgeFunctions(deviceName, 'hardware_key');
  }

  async registerPasskey(userId: string, email: string): Promise<void> {
    await this._registerWithEdgeFunctions(this.getDeviceName(), 'passkey');
  }

  private async _registerWithEdgeFunctions(
    deviceName: string,
    credentialType: 'passkey' | 'hardware_key'
  ): Promise<void> {
    if (!await this.isSupported()) {
      throw new Error('WebAuthn is not supported on this browser');
    }
    if (credentialType === 'passkey' && !await this.isPlatformAuthenticatorAvailable()) {
      throw new Error('Passkeys are not supported on this device');
    }

    const supabase = await getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    // 1. Fetch registration options from server (server generates the challenge)
    const startRes = await callEdgeFunction(
      'webauthn-register-start',
      { credentialType },
      session.access_token
    );
    if (!startRes.ok) {
      const err = await startRes.json().catch(() => ({ error: 'Failed to start registration' }));
      throw new Error(err.error ?? 'Failed to start registration');
    }
    const options = await startRes.json();
    const { challengeId, challenge, rp, user, pubKeyCredParams, authenticatorSelection,
      excludeCredentials, timeout, attestation } = options;

    // 2. Call the WebAuthn API with the server-provided challenge
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: base64urlDecode(challenge),
        rp,
        user: {
          ...user,
          id: base64urlDecode(user.id),
        },
        pubKeyCredParams,
        authenticatorSelection,
        excludeCredentials: (excludeCredentials ?? []).map((c: any) => ({
          ...c,
          id: base64urlDecode(c.id),
        })),
        timeout,
        attestation,
      },
    }) as PublicKeyCredential | null;

    if (!credential) throw new Error('Passkey creation was cancelled');

    const attestationResponse = credential.response as AuthenticatorAttestationResponse;

    // 3. Send attestation to server for verification and storage
    const finishRes = await callEdgeFunction(
      'webauthn-register-finish',
      {
        challengeId,
        deviceName,
        credentialType,
        response: {
          id: credential.id,
          rawId: base64urlEncode(credential.rawId),
          clientDataJSON: base64urlEncode(attestationResponse.clientDataJSON),
          attestationObject: base64urlEncode(attestationResponse.attestationObject),
          type: credential.type,
        },
      },
      session.access_token
    );

    if (!finishRes.ok) {
      const err = await finishRes.json().catch(() => ({ error: 'Registration verification failed' }));
      throw new Error(err.error ?? 'Registration verification failed');
    }
  }

  // ── Authentication (full server-side ceremony with signature verification) ──

  /**
   * Passkey sign-in (discoverable credentials).
   * Returns a tokenHash that the caller should exchange via:
   *   supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
   */
  async signInWithPasskey(signal?: AbortSignal): Promise<PasskeySignInResult> {
    if (!await this.isSupported()) {
      throw new Error('WebAuthn is not supported on this browser');
    }

    // 1. Get server-side challenge
    const startRes = await callEdgeFunction('webauthn-authenticate-start', {});
    if (!startRes.ok) {
      const err = await startRes.json().catch(() => ({ error: 'Failed to start authentication' }));
      throw new Error(err.error ?? 'Failed to start authentication');
    }
    const { challengeId, challenge, allowCredentials, userVerification, timeout } =
      await startRes.json();

    // 2. Prompt the authenticator
    const assertion = await navigator.credentials.get({
      signal,
      publicKey: {
        challenge: base64urlDecode(challenge),
        allowCredentials: (allowCredentials ?? []).map((c: any) => ({
          ...c,
          id: base64urlDecode(c.id),
        })),
        userVerification,
        timeout,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) throw new Error('Authentication was cancelled');

    const assertionResponse = assertion.response as AuthenticatorAssertionResponse;

    // 3. Send assertion to server — server verifies signature, counter, origin, challenge
    const finishRes = await callEdgeFunction('webauthn-authenticate-finish', {
      challengeId,
      response: {
        id: assertion.id,
        rawId: base64urlEncode(assertion.rawId),
        clientDataJSON: base64urlEncode(assertionResponse.clientDataJSON),
        authenticatorData: base64urlEncode(assertionResponse.authenticatorData),
        signature: base64urlEncode(assertionResponse.signature),
        userHandle: assertionResponse.userHandle
          ? base64urlEncode(assertionResponse.userHandle)
          : null,
        type: assertion.type,
      },
    });

    if (!finishRes.ok) {
      const err = await finishRes.json().catch(() => ({ error: 'Authentication failed' }));
      throw new Error(err.error ?? 'Authentication failed');
    }

    const result = await finishRes.json();
    return {
      tokenHash: result.tokenHash,
      email: result.email,
      userId: result.userId,
    };
  }

  /**
   * Conditional (autofill-assisted) passkey flow.
   * Returns a server-generated challenge to use with mediation: 'conditional'.
   * After the assertion is returned, call finishConditionalSignIn().
   */
  async startConditionalSignIn(): Promise<{ challenge: Uint8Array; challengeId: string }> {
    const startRes = await callEdgeFunction('webauthn-authenticate-start', {});
    if (!startRes.ok) throw new Error('Failed to start conditional sign-in');
    const { challengeId, challenge } = await startRes.json();
    return { challenge: base64urlDecode(challenge), challengeId };
  }

  async finishConditionalSignIn(
    assertion: PublicKeyCredential,
    challengeId: string
  ): Promise<PasskeySignInResult> {
    const assertionResponse = assertion.response as AuthenticatorAssertionResponse;

    const finishRes = await callEdgeFunction('webauthn-authenticate-finish', {
      challengeId,
      response: {
        id: assertion.id,
        rawId: base64urlEncode(assertion.rawId),
        clientDataJSON: base64urlEncode(assertionResponse.clientDataJSON),
        authenticatorData: base64urlEncode(assertionResponse.authenticatorData),
        signature: base64urlEncode(assertionResponse.signature),
        userHandle: assertionResponse.userHandle
          ? base64urlEncode(assertionResponse.userHandle)
          : null,
        type: assertion.type,
      },
    });

    if (!finishRes.ok) {
      const err = await finishRes.json().catch(() => ({ error: 'Authentication failed' }));
      throw new Error(err.error ?? 'Authentication failed');
    }

    const result = await finishRes.json();
    return { tokenHash: result.tokenHash, email: result.email, userId: result.userId };
  }

  /**
   * 2FA / step-up authentication for an already signed-in user.
   * Returns true if the passkey assertion is valid.
   */
  async authenticate(userId: string): Promise<boolean> {
    if (!await this.isSupported()) {
      throw new Error('WebAuthn is not supported on this browser');
    }

    const supabase = await getSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    // 1. Get server-side challenge for this specific user
    const startRes = await callEdgeFunction('webauthn-authenticate-start', { userId });
    if (!startRes.ok) throw new Error('Failed to start authentication');
    const { challengeId, challenge, allowCredentials, userVerification, timeout } =
      await startRes.json();

    if (!allowCredentials || allowCredentials.length === 0) {
      throw new Error('No security keys registered');
    }

    // 2. Prompt the authenticator
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: base64urlDecode(challenge),
        allowCredentials: allowCredentials.map((c: any) => ({
          ...c,
          id: base64urlDecode(c.id),
        })),
        userVerification,
        timeout,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return false;

    const assertionResponse = assertion.response as AuthenticatorAssertionResponse;

    // 3. Server verifies signature — for 2FA the session token is included
    const finishRes = await callEdgeFunction(
      'webauthn-authenticate-finish',
      {
        challengeId,
        response: {
          id: assertion.id,
          rawId: base64urlEncode(assertion.rawId),
          clientDataJSON: base64urlEncode(assertionResponse.clientDataJSON),
          authenticatorData: base64urlEncode(assertionResponse.authenticatorData),
          signature: base64urlEncode(assertionResponse.signature),
          userHandle: assertionResponse.userHandle
            ? base64urlEncode(assertionResponse.userHandle)
            : null,
          type: assertion.type,
        },
      },
      session?.access_token
    );

    if (!finishRes.ok) {
      const err = await finishRes.json().catch(() => ({ error: 'Verification failed' }));
      throw new Error(err.error ?? 'Passkey verification failed');
    }

    return true;
  }

  // ── Credential management ─────────────────────────────────────────────────

  async listCredentials(userId: string): Promise<WebAuthnCredential[]> {
    const supabase = await getSupabase();
    const { data } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async listHardwareKeys(userId: string): Promise<WebAuthnCredential[]> {
    const supabase = await getSupabase();
    const { data } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('credential_type', 'hardware_key')
      .order('created_at', { ascending: false });
    return data || [];
  }

  async listPasskeys(userId: string): Promise<WebAuthnCredential[]> {
    const supabase = await getSupabase();
    const { data } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('credential_type', 'passkey')
      .order('created_at', { ascending: false });
    return data || [];
  }

  async removeCredential(credentialId: string): Promise<void> {
    const supabase = await getSupabase();
    await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', credentialId);
  }

  // ── Wallet PRF (Pseudo-Random Function) methods ───────────────────────────
  // These use the WebAuthn PRF extension to derive a 32-byte encryption key
  // from a passkey assertion. The key is used to encrypt/decrypt the wallet vault.
  // PRF is a client-side crypto operation — no server verification needed here
  // because the output (derived key) is used purely for local decryption.

  async isWalletPRFSupported(): Promise<boolean> {
    return this.isPlatformAuthenticatorAvailable();
  }

  async registerWalletPasskey(
    userId: string,
    email: string
  ): Promise<{ credentialId: string; prfSalt: string } | null> {
    if (!await this.isSupported()) throw new Error('WebAuthn is not supported on this browser');
    if (!await this.isPlatformAuthenticatorAvailable()) {
      throw new Error('Passkeys are not supported on this device');
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const prfSalt = crypto.getRandomValues(new Uint8Array(32));

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Pexly', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userId + '-wallet'),
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
          requireResidentKey: true,
        },
        timeout: 60000,
        attestation: 'none',
        extensions: {
          prf: { eval: { first: prfSalt.buffer } },
        } as any,
      },
    }) as PublicKeyCredential | null;

    if (!credential) throw new Error('Passkey creation was cancelled');

    const ext = (credential.getClientExtensionResults() as any);
    if (!ext?.prf?.enabled) return null;

    const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    const prfSaltB64 = btoa(String.fromCharCode(...prfSalt));
    return { credentialId, prfSalt: prfSaltB64 };
  }

  async getWalletDecryptionKey(
    credentialId: string,
    prfSaltBase64: string
  ): Promise<ArrayBuffer | null> {
    if (!await this.isSupported()) return null;

    const credentialIdBytes = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0));
    const prfSalt = Uint8Array.from(atob(prfSaltBase64), c => c.charCodeAt(0));
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: 'public-key', id: credentialIdBytes }],
        userVerification: 'required',
        timeout: 60000,
        extensions: {
          prf: { eval: { first: prfSalt.buffer } },
        } as any,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return null;
    const ext = (assertion.getClientExtensionResults() as any);
    const prfResult = ext?.prf?.results?.first;
    return prfResult ?? null;
  }
}

export const webAuthnService = new WebAuthnService();
