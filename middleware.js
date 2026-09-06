export const config = {
  matcher: '/:path*', // Runs on every request
};

export default function middleware(request) {
  const cloudflareSecret = request.headers.get('x-cloudflare-secret');
  const EXPECTED_SECRET = process.env.CLOUDFLARE_SECRET_TOKEN;

  if (!cloudflareSecret || cloudflareSecret !== EXPECTED_SECRET) {
    return new Response('Access Denied: Direct origin access is prohibited.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Returning nothing (undefined) tells Vercel to let the request continue
  // through normally — no @vercel/edge import needed.
}