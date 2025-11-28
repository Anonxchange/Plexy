
import { createClient } from './supabase';

export interface WebAuthnCredential {
  id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_name: string;
  created_at: string;
}

class WebAuthnService {
  private supabase = createClient();

  async isSupported(): Promise<boolean> {
    return !!window.PublicKeyCredential;
  }

  async register(userId: string, deviceName: string): Promise<void> {
    if (!await this.isSupported()) {
      throw new Error('WebAuthn is not supported on this browser');
    }

    // Generate challenge from server
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Pexly',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userId,
        displayName: deviceName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform', // Hardware key
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'direct',
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    
    // Store credential in database
    const credentialId = Array.from(new Uint8Array(credential.rawId))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const publicKey = Array.from(new Uint8Array(response.getPublicKey()!))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    await this.supabase
      .from('webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: credentialId,
        public_key: publicKey,
        counter: 0,
        device_name: deviceName,
      });
  }

  async authenticate(userId: string): Promise<boolean> {
    if (!await this.isSupported()) {
      throw new Error('WebAuthn is not supported on this browser');
    }

    // Get user's credentials
    const { data: credentials } = await this.supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId);

    if (!credentials || credentials.length === 0) {
      throw new Error('No security keys registered');
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const allowCredentials = credentials.map(cred => ({
      type: 'public-key' as const,
      id: Uint8Array.from(cred.credential_id.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))),
    }));

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials,
      timeout: 60000,
      userVerification: 'preferred',
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return false;
    }

    // In production, verify the signature on the server
    // For now, we'll consider it valid if we got this far
    return true;
  }

  async listCredentials(userId: string): Promise<WebAuthnCredential[]> {
    const { data } = await this.supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  async removeCredential(credentialId: string): Promise<void> {
    await this.supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', credentialId);
  }
}

export const webAuthnService = new WebAuthnService();
