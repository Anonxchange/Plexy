import { createClient } from "npm:@supabase/supabase-js@2";
import { getAddress, isAddress, verifyMessage } from "npm:viem@2";
import { parseSiweMessage } from "npm:viem@2/siwe";

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};
const defaultAllowedOrigins = [
  "https://pexly.com",
  "https://www.pexly.com",
  "https://pexly.app",
  "https://www.pexly.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];
const statements = {
  "sign-in": "Sign in to Pexly. This message does not authorize a transaction.",
  link: "Link this wallet to your Pexly account. This message does not authorize a transaction.",
} as const;
const supportedChainIds = new Set([1, 10, 56, 137, 8453, 42161, 43114]);

class RequestError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

function getAllowedOrigins() {
  const configured = Deno.env.get("SIWE_ALLOWED_ORIGINS") ?? "";
  return new Set(
    [...defaultAllowedOrigins, ...configured.split(",")]
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => new URL(origin).origin),
  );
}

function requireTrustedOrigin(request: Request) {
  const rawOrigin = request.headers.get("Origin");
  if (!rawOrigin) throw new RequestError("A trusted browser origin is required.", 403);

  let origin: string;
  try {
    origin = new URL(rawOrigin).origin;
  } catch {
    throw new RequestError("The browser origin is invalid.", 403);
  }
  if (!getAllowedOrigins().has(origin)) {
    throw new RequestError("This application origin is not allowed to use wallet authentication.", 403);
  }
  return origin;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  origin = "null",
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function getAccessToken(request: Request) {
  return request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

async function getAuthenticatedUser(
  request: Request,
  supabaseUrl: string,
  anonKey: string,
) {
  const accessToken = getAccessToken(request);
  if (!accessToken) throw new RequestError("Sign in before linking a wallet.", 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: authOptions,
  });
  const { data, error } = await userClient.auth.getUser(accessToken);
  if (error || !data.user) throw new RequestError("Your Pexly session is invalid.", 401);
  return data.user;
}

function getWalletAddress(value: unknown) {
  if (typeof value !== "string" || !isAddress(value.trim())) {
    throw new RequestError("A valid EVM wallet address is required.");
  }
  return getAddress(value.trim()).toLowerCase();
}

async function issueNonce(
  admin: ReturnType<typeof createClient>,
  walletAddress: string,
  purpose: "sign-in" | "link",
  userId: string | null,
) {
  const now = new Date();
  const { error: cleanupError } = await admin
    .from("auth_nonces")
    .delete()
    .lt("expires_at", now.toISOString());
  if (cleanupError) throw cleanupError;

  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = Array.from(nonceBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(now.getTime() + 5 * 60_000).toISOString();
  const { error } = await admin.from("auth_nonces").insert({
    nonce,
    wallet_address: walletAddress,
    purpose,
    user_id: userId,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return { nonce, expiresAt };
}

async function verifySiweMessage(
  message: string,
  signature: string,
  walletAddress: string,
  purpose: "sign-in" | "link",
  origin: string,
) {
  if (!message || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    throw new RequestError("A valid SIWE message and signature are required.");
  }

  let siwe: ReturnType<typeof parseSiweMessage>;
  try {
    siwe = parseSiweMessage(message);
  } catch {
    throw new RequestError("The SIWE message is malformed.");
  }

  const issuedAt = siwe.issuedAt ? Date.parse(siwe.issuedAt) : NaN;
  const expirationTime = siwe.expirationTime ? Date.parse(siwe.expirationTime) : NaN;
  let uriOrigin = "";
  try {
    uriOrigin = siwe.uri ? new URL(siwe.uri).origin : "";
  } catch {
    // The validation below returns the same generic invalid-message response.
  }
  const now = Date.now();
  const age = now - issuedAt;
  if (
    !siwe.address ||
    siwe.address.toLowerCase() !== walletAddress ||
    siwe.domain !== new URL(origin).host ||
    uriOrigin !== origin ||
    siwe.version !== "1" ||
    !siwe.nonce ||
    siwe.statement !== statements[purpose] ||
    !Number.isFinite(siwe.chainId) ||
    !supportedChainIds.has(Number(siwe.chainId)) ||
    !Number.isFinite(issuedAt) ||
    age < -60_000 ||
    age > 5 * 60_000 ||
    !Number.isFinite(expirationTime) ||
    expirationTime <= now ||
    expirationTime < issuedAt ||
    expirationTime - issuedAt > 5 * 60_000
  ) {
    throw new RequestError("The SIWE message is invalid or expired.");
  }

  let signatureIsValid = false;
  try {
    signatureIsValid = await verifyMessage({
      address: walletAddress,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    signatureIsValid = false;
  }
  if (!signatureIsValid) {
    throw new RequestError("The wallet signature could not be verified.", 403);
  }
  return siwe;
}

async function consumeNonce(
  admin: ReturnType<typeof createClient>,
  nonce: string,
  walletAddress: string,
  purpose: "sign-in" | "link",
  userId: string | null,
) {
  let query = admin
    .from("auth_nonces")
    .delete()
    .eq("nonce", nonce)
    .eq("wallet_address", walletAddress)
    .eq("purpose", purpose)
    .gt("expires_at", new Date().toISOString());
  query = userId ? query.eq("user_id", userId) : query.is("user_id", null);
  const { data, error } = await query.select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new RequestError("This wallet challenge was already used or has expired.", 401);
}

Deno.serve(async (request) => {
  let origin = "null";
  try {
    origin = requireTrustedOrigin(request);
  } catch (error) {
    const status = error instanceof RequestError ? error.status : 500;
    const message = error instanceof RequestError
      ? error.message
      : "Wallet authentication is not configured.";
    if (request.method === "OPTIONS") {
      return new Response(message, { status, headers: corsHeaders("null") });
    }
    return jsonResponse({ error: message }, status);
  }

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, origin);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new RequestError("The wallet-auth function is not configured.", 500);
    }

    const body = await request.json();
    const action = body.action;
    const walletAddress = getWalletAddress(body.walletAddress);
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: authOptions });

    if (action === "nonce") {
      if (body.purpose !== "sign-in" && body.purpose !== "link") {
        throw new RequestError("Choose a valid wallet challenge purpose.");
      }
      const purpose = body.purpose as "sign-in" | "link";
      const user = purpose === "link"
        ? await getAuthenticatedUser(request, supabaseUrl, anonKey)
        : null;
      const nonce = await issueNonce(
        admin,
        walletAddress,
        purpose,
        user?.id ?? null,
      );
      return jsonResponse(nonce, 200, origin);
    }

    if (action !== "sign-in" && action !== "link") {
      throw new RequestError("Choose a valid wallet authentication action.");
    }

    const user = action === "link"
      ? await getAuthenticatedUser(request, supabaseUrl, anonKey)
      : null;
    const message = typeof body.message === "string" ? body.message : "";
    const signature = typeof body.signature === "string" ? body.signature : "";
    const siwe = await verifySiweMessage(
      message,
      signature,
      walletAddress,
      action,
      origin,
    );
    await consumeNonce(
      admin,
      siwe.nonce!,
      walletAddress,
      action,
      user?.id ?? null,
    );

    if (action === "sign-in") {
      const authClient = createClient(supabaseUrl, anonKey, { auth: authOptions });
      const captchaToken = typeof body.captchaToken === "string"
        ? body.captchaToken
        : undefined;
      const { data, error } = await authClient.auth.signInWithWeb3({
        chain: "ethereum",
        message,
        signature: signature as `0x${string}`,
        options: { captchaToken },
      });
      if (error) throw new RequestError(error.message, 401);
      if (!data.session?.access_token || !data.session.refresh_token || !data.user) {
        throw new RequestError("Supabase did not return an active wallet session.", 401);
      }

      const { error: walletError } = await admin.rpc("set_verified_user_wallet", {
        p_user_id: data.user.id,
        p_wallet_address: walletAddress,
      });
      if (walletError) throw walletError;
      return jsonResponse({ session: data.session }, 200, origin);
    }

    const { error: walletError } = await admin.rpc("set_verified_user_wallet", {
      p_user_id: user!.id,
      p_wallet_address: walletAddress,
    });
    if (walletError) throw walletError;
    return jsonResponse({ ok: true, walletAddress }, 200, origin);
  } catch (error) {
    console.error("link-wallet failed", error);
    const status = error instanceof RequestError ? error.status : 500;
    const message = error instanceof RequestError
      ? error.message
      : "Wallet verification could not be completed.";
    return jsonResponse({ error: message }, status, origin);
  }
});
