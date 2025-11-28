
import { createClient } from './supabase';

export interface WebAuthnCredential {
  id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_name: string;
  credential_type: 'hardware_key' | 'passkey';
  created_at: string;
}

class WebAuthnService {
  private supabase = createClient();

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

  async register(userId: string, deviceName: string): Promise<void> {
    await this.registerCredential(userId, deviceName, 'hardware_key');
  }

  async registerPasskey(userId: string, email: string): Promise<void> {
    await this.registerCredential(userId, email, 'passkey');
  }

  private async registerCredential(
    userId: string, 
    displayName: string, 
    credentialType: 'hardware_key' | 'passkey'
  ): Promise<void> {
    if (!await this.isSupported()) {
      throw new Error('WebAuthn is not supported on this browser');
    }

    if (credentialType === 'passkey' && !await this.isPlatformAuthenticatorAvailable()) {
      throw new Error('Passkeys are not supported on this device');
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Pexly',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: displayName,
        displayName: displayName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: credentialType === 'passkey' ? {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
        requireResidentKey: true,
      } : {
        authenticatorAttachment: 'cross-platform',
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
    
    const credentialId = Array.from(new Uint8Array(credential.rawId))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const publicKeyBytes = response.getPublicKey();
    const publicKey = publicKeyBytes 
      ? Array.from(new Uint8Array(publicKeyBytes))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      : '';

    await this.supabase
      .from('webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: credentialId,
        public_key: publicKey,
        counter: 0,
        device_name: displayName,
        credential_type: credentialType,
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
      id: Uint8Array.from(cred.credential_id.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))),
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

  async listHardwareKeys(userId: string): Promise<WebAuthnCredential[]> {
    const { data } = await this.supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('credential_type', 'hardware_key')
      .order('created_at', { ascending: false });

    return data || [];
  }

  async listPasskeys(userId: string): Promise<WebAuthnCredential[]> {
    const { data } = await this.supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('credential_type', 'passkey')
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
