export const config = {
  runtime: 'edge', // Runs instantly across Vercel's global network nodes
};

export default async function handler(request) {
  // 1. Get the secret token sent by Cloudflare
  const cloudflareSecret = request.headers.get('x-cloudflare-secret');
  
  // 2. Fetch your environment variable secret
  const EXPECTED_SECRET = process.env.CLOUDFLARE_SECRET_TOKEN;

  // 3. Block access if the secret is missing or incorrect
  if (!cloudflareSecret || cloudflareSecret !== EXPECTED_SECRET) {
    return new Response('Access Denied: Direct origin access is prohibited.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 4. Token matches! Let Vercel fall through to serve index.html
  return new Response(null, { status: 200 });
}
