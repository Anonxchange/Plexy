/**
 * Client-side helper for the hardened image-proxy edge function.
 *
 * Signs the target URL with HMAC-SHA256 so the proxy can verify the
 * request wasn't tampered with. The secret is intentionally client-visible
 * (it's in the Vite bundle) — that is acceptable because the proxy enforces
 * an independent server-side allowlist + SSRF guards regardless of whether
 * someone has the secret. The signature only prevents parameter substitution
 * attacks (swapping the `url` query param for a different host).
 *
 * Usage:
 *   import { proxyImageUrl } from '@/lib/image-proxy'
 *   <img src={await proxyImageUrl('https://s3.amazonaws.com/...')} />
 *
 * Or use the synchronous cache-aware wrapper:
 *   import { useProxiedImage } from '@/lib/image-proxy'
 */

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL as string
const PROXY_SECRET     = import.meta.env.VITE_IMAGE_PROXY_SECRET as string
const SIGNATURE_TTL_MS = 5 * 60 * 1000   // 5 minutes — matches server-side TTL

// In-memory cache: original URL → { proxied URL, expires at }
const cache = new Map<string, { url: string; expiresAt: number }>()

async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Returns a signed proxy URL for the given image source.
 * Results are cached until 30 seconds before the signature expires.
 */
export async function proxyImageUrl(src: string): Promise<string> {
  if (!src) return ''

  // Return original URL if proxy isn't configured (dev / missing env vars)
  if (!SUPABASE_URL || !PROXY_SECRET) return src

  // Serve from cache if still valid (expire 30 s early for safety margin)
  const cached = cache.get(src)
  if (cached && Date.now() < cached.expiresAt - 30_000) {
    return cached.url
  }

  const exp = String(Date.now() + SIGNATURE_TTL_MS)
  const sig = await hmacSign(PROXY_SECRET, `${src}:${exp}`)

  const proxyUrl =
    `${SUPABASE_URL}/functions/v1/image-proxy` +
    `?url=${encodeURIComponent(src)}` +
    `&exp=${exp}` +
    `&sig=${sig}`

  cache.set(src, { url: proxyUrl, expiresAt: Date.now() + SIGNATURE_TTL_MS })
  return proxyUrl
}

/**
 * React hook — resolves a signed proxy URL asynchronously.
 * Falls back to the original URL while the signature is being generated.
 *
 * Example:
 *   const proxied = useProxiedImage(operator.logoUrl)
 *   <img src={proxied} />
 */
import { useState, useEffect } from 'react'

export function useProxiedImage(src: string | undefined | null): string {
  const [url, setUrl] = useState<string>(src || '')

  useEffect(() => {
    if (!src) { setUrl(''); return }

    // Optimistic: show original while signing
    setUrl(src)

    let cancelled = false
    proxyImageUrl(src).then((signed) => {
      if (!cancelled) setUrl(signed)
    })

    return () => { cancelled = true }
  }, [src])

  return url
}
