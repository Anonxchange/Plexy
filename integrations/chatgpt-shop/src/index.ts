type Env = {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  PEXLY_BASE_URL?: string;
  CACHE_TTL_SECONDS?: string;
  MCP_ACCESS_TOKEN?: string;
};

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const PROTOCOL_VERSION = "2025-03-26";
const WIDGET_URI = "ui://widget/pexly-shop-v1.html";
const WIDGET_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Pexly Shop</title>\n<style>\n:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#171717;background:#fff}\n*{box-sizing:border-box}body{margin:0;padding:16px}header{display:flex;align-items:center;gap:10px;margin-bottom:14px}\n.mark{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:#171717;color:#fff;font-weight:800;letter-spacing:-1px}\n.brand{font-weight:750;font-size:17px}.sub{font-size:12px;color:#737373;margin-top:2px}\n#status{font-size:13px;color:#737373;margin:8px 0 12px}\n.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px}\n.card{overflow:hidden;border:1px solid #e5e5e5;border-radius:14px;background:white;display:flex;flex-direction:column;min-width:0}\n.image{width:100%;aspect-ratio:1.15;background:#f5f5f5;object-fit:contain;display:block}\n.body{padding:11px;display:flex;flex-direction:column;gap:7px;flex:1}\n.name{font-size:14px;line-height:1.35;font-weight:650;overflow-wrap:anywhere}\n.type{font-size:11px;color:#737373}.price{font-size:15px;font-weight:750}\n.avail{font-size:11px;color:#15803d}.unavail{font-size:11px;color:#b91c1c}\na.cta{display:block;text-align:center;text-decoration:none;background:#171717;color:white;border-radius:9px;padding:9px 10px;font-size:12px;font-weight:650;margin-top:auto}\na.cta:focus-visible{outline:2px solid #737373;outline-offset:2px}\n.empty{padding:18px;border:1px dashed #d4d4d4;border-radius:12px;color:#737373;font-size:13px}\nfooter{font-size:11px;color:#737373;margin-top:14px}\n</style>\n</head>\n<body>\n<header><div class=\"mark\">P</div><div><div class=\"brand\">Pexly Shop</div><div class=\"sub\">Discover something useful</div></div></header>\n<div id=\"status\">Loading product results…</div><main id=\"results\" class=\"grid\"></main>\n<footer>Product details and availability may change. Purchases are completed securely on pexly.app.</footer>\n<script>\n(function(){\n const status=document.getElementById('status'), results=document.getElementById('results');\n const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));\n const money=p=>{if(!p||p.amount==null)return 'See price on Pexly';try{return new Intl.NumberFormat(undefined,{style:'currency',currency:p.currency||'USD'}).format(Number(p.amount))}catch{return esc(p.amount)+' '+esc(p.currency||'')}};\n function render(data){\n   const payload=data?.structuredContent??data?.toolOutput??data;\n   const list=Array.isArray(payload?.products)?payload.products:(payload?.handle?[payload]:[]);\n   results.replaceChildren();\n   if(!list.length){status.textContent='Search Pexly products in the chat to see matching items here.';return}\n   status.textContent=payload?.query?'Results for “'+payload.query+'” · '+list.length+' item'+(list.length===1?'':'s'):list.length+' product'+(list.length===1?'':'s');\n   for(const p of list){\n     const card=document.createElement('article');card.className='card';\n     const img=document.createElement('img');img.className='image';img.alt=p.images?.[0]?.alt||p.title||'Pexly product';img.loading='lazy';img.src=p.images?.[0]?.url||'';img.onerror=()=>{img.style.visibility='hidden'};card.appendChild(img);\n     const body=document.createElement('div');body.className='body';\n     const type=document.createElement('div');type.className='type';type.textContent=p.productType||'PEXLY PRODUCT';body.appendChild(type);\n     const name=document.createElement('div');name.className='name';name.textContent=p.title||'Product';body.appendChild(name);\n     const price=document.createElement('div');price.className='price';price.textContent=money(p.price);body.appendChild(price);\n     if(p.available!==null&&p.available!==undefined){const a=document.createElement('div');a.className=p.available?'avail':'unavail';a.textContent=p.available?'Available':'Check availability';body.appendChild(a)}\n     const link=document.createElement('a');link.className='cta';link.href=p.url||'https://pexly.app';link.target='_blank';link.rel='noopener noreferrer';link.textContent='View on Pexly';body.appendChild(link);\n     card.appendChild(body);results.appendChild(card);\n   }\n }\n function readHostOutput(){\n   const host=window.openai;\n   if(host?.toolOutput){render(host.toolOutput);return true}\n   if(host?.toolResponseMetadata?.structuredContent){render(host.toolResponseMetadata.structuredContent);return true}\n   return false;\n }\n if(!readHostOutput()) status.textContent='Search for a product in ChatGPT and choose Pexly Shop to view matching products.';\n window.addEventListener('openai:tool_output',readHostOutput);\n window.addEventListener('message',event=>{\n   if(event.source!==window.parent||!event.data)return;\n   const m=event.data;\n   if(m.type==='ui/notifications/tool-result')render(m.params?.structuredContent??m.params?.content);\n });\n})();\n</script>\n</body>\n</html>";
const MAX_BODY_BYTES = 16 * 1024;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 10;

const TOOL_DEFINITIONS: any[] = [
  {
    name: "search_products",
    description:
      "Search Pexly's public physical-product catalogue. Returns a small set of published products with current Storefront API prices and links to their product pages on pexly.app. Does not place orders or process payments.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Product name or keywords to search for (2–100 characters).",
          minLength: 2,
          maxLength: 100,
        },
        limit: {
          type: "integer",
          description: "Maximum number of results (1–10; defaults to 6).",
          minimum: 1,
          maximum: 10,
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_product_details",
    description:
      "Get public details for one Pexly product by its Shopify handle. Use a handle returned by search_products. Does not place orders or process payments.",
    inputSchema: {
      type: "object",
      properties: {
        handle: {
          type: "string",
          description: "The product handle returned by search_products.",
          minLength: 1,
          maxLength: 200,
        },
      },
      required: ["handle"],
      additionalProperties: false,
    },
  },
];

// Attach the product-card UI to both read-only catalogue tools.
for (const tool of TOOL_DEFINITIONS) {
  tool._meta = {
    ui: { resourceUri: WIDGET_URI },
    "openai/outputTemplate": WIDGET_URI,
  };
  tool.annotations = {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  };
}

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function rpcResult(id: JsonRpcRequest["id"], result: unknown): Response {
  return json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  status = 200,
): Response {
  return json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, status);
}

function textResult(value: unknown, isError = false) {
  const text = JSON.stringify(value);
  return {
    content: [{ type: "text", text }],
    structuredContent: value,
    ...(isError ? { isError: true } : {}),
  };
}

function cleanQuery(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 100) return null;
  // Avoid passing Shopify search operators or syntax from untrusted user input.
  const safe = normalized.replace(/[^\p{L}\p{N}\s\-']/gu, "").trim();
  return safe.length >= 2 ? safe : null;
}

function productUrl(env: Env, handle: string): string {
  const base = (env.PEXLY_BASE_URL || "https://pexly.app").replace(/\/$/, "");
  return `${base}/shop/product/${encodeURIComponent(handle)}`;
}

function stripHtml(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function mapProduct(raw: any, env: Env) {
  const node = raw?.node ?? raw;
  if (!node || typeof node.handle !== "string" || typeof node.title !== "string") return null;

  const price = node.priceRange?.minVariantPrice;
  const variants = Array.isArray(node.variants?.edges)
    ? node.variants.edges.map((edge: any) => edge?.node).filter(Boolean)
    : [];
  const imageEdges = Array.isArray(node.images?.edges) ? node.images.edges : [];
  const images = imageEdges
    .map((edge: any) => edge?.node)
    .filter((image: any) => typeof image?.url === "string")
    .slice(0, 4)
    .map((image: any) => ({ url: image.url, alt: image.altText || node.title }));

  return {
    handle: node.handle,
    title: stripHtml(node.title, 160),
    description: stripHtml(node.description || node.descriptionHtml, 500),
    productType: typeof node.productType === "string" ? node.productType.slice(0, 100) : "",
    price: price && typeof price.amount === "string"
      ? { amount: price.amount, currency: price.currencyCode || "USD" }
      : null,
    available: variants.length > 0
      ? variants.some((variant: any) => variant.availableForSale === true)
      : null,
    images,
    url: productUrl(env, node.handle),
  };
}

async function fetchStorefront(
  env: Env,
  queryName: "getProducts" | "getProductByHandle",
  variables: Record<string, unknown>,
): Promise<any> {
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/functions/v1/shopify-storefront`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ queryName, variables }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    // Never return upstream response bodies: they may contain implementation details.
    throw new Error(`Catalog request failed (${response.status}).`);
  }

  const payload = await response.json() as any;
  if (payload?.error) throw new Error("Catalog is temporarily unavailable.");
  return payload?.data ?? payload;
}

async function cachedFetch(
  requestKey: string,
  ttlSeconds: number,
  fetcher: () => Promise<unknown>,
): Promise<unknown> {
  // Cloudflare's Cache API is data-center-local. A cache miss elsewhere is safe;
  // this is an optimization, not a source of truth.
  const cache = caches.default;
  const cacheRequest = new Request(`https://pexly-mcp-cache.invalid/${encodeURIComponent(requestKey)}`);
  const cached = await cache.match(cacheRequest);
  if (cached) return cached.json();

  const value = await fetcher();
  const response = new Response(JSON.stringify(value), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${Math.max(1, Math.min(ttlSeconds, 300))}`,
    },
  });
  await cache.put(cacheRequest, response);
  return value;
}

async function searchProducts(args: Record<string, unknown>, env: Env) {
  const query = cleanQuery(args.query);
  if (!query) throw new Error("Enter a product search of 2–100 letters or numbers.");
  const requestedLimit = Number.isInteger(args.limit) ? Number(args.limit) : DEFAULT_LIMIT;
  if (requestedLimit < 1 || requestedLimit > MAX_LIMIT) {
    throw new Error("limit must be an integer between 1 and 10.");
  }

  const ttl = Number(env.CACHE_TTL_SECONDS) || 60;
  const cacheKey = `search:${query.toLocaleLowerCase()}:${requestedLimit}`;
  return cachedFetch(cacheKey, ttl, async () => {
    const data = await fetchStorefront(env, "getProducts", {
      first: requestedLimit,
      query,
    });
    const edges = data?.products?.edges;
    const products = Array.isArray(edges)
      ? edges
        .map((edge: any) => mapProduct(edge, env))
        .filter((product: any) => product && product.available !== false)
      : [];
    return { query, count: products.length, products };
  });
}

async function getProductDetails(args: Record<string, unknown>, env: Env) {
  const handle = typeof args.handle === "string" ? args.handle.trim() : "";
  if (!handle || handle.length > 200 || !/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(handle)) {
    throw new Error("Provide a valid product handle returned by search_products.");
  }

  const ttl = Number(env.CACHE_TTL_SECONDS) || 60;
  return cachedFetch(`product:${handle.toLowerCase()}`, ttl, async () => {
    const data = await fetchStorefront(env, "getProductByHandle", { handle });
    const raw = data?.productByHandle;
    const product = mapProduct(raw, env);
    if (!product) throw new Error("No published product was found for that handle.");
    return product;
  });
}

async function handleToolCall(params: Record<string, unknown>, env: Env) {
  const name = params.name;
  const args = params.arguments && typeof params.arguments === "object"
    ? params.arguments as Record<string, unknown>
    : {};

  try {
    if (name === "search_products") return textResult(await searchProducts(args, env));
    if (name === "get_product_details") return textResult(await getProductDetails(args, env));
    return textResult({ error: "Unknown tool." }, true);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return textResult({ error: message }, true);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true, service: "pexly-chatgpt-shop", mode: "read-only" });
    }
    if (url.pathname !== "/mcp") return json({ error: "Not found" }, 404);
    if (request.method !== "POST") {
      return json({ error: "Use POST for MCP JSON-RPC requests." }, 405, { allow: "POST" });
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
      return json({ error: "Catalog service is not configured." }, 503);
    }

    if (env.MCP_ACCESS_TOKEN) {
      const authorization = request.headers.get("authorization") || "";
      if (authorization !== `Bearer ${env.MCP_ACCESS_TOKEN}`) {
        return json({ error: "Unauthorized" }, 401, { "www-authenticate": "Bearer" });
      }
    }

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY_BYTES) return json({ error: "Request body too large." }, 413);
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) return json({ error: "Request body too large." }, 413);

    let rpc: JsonRpcRequest;
    try {
      rpc = JSON.parse(rawBody) as JsonRpcRequest;
    } catch {
      return rpcError(null, -32700, "Parse error.");
    }
    if (rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string") {
      return rpcError(rpc.id, -32600, "Invalid Request.");
    }

    if (rpc.method === "notifications/initialized" || rpc.method.startsWith("notifications/")) {
      return new Response(null, { status: 202 });
    }

    if (rpc.method === "initialize") {
      return rpcResult(rpc.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "pexly-chatgpt-shop", version: "0.1.0" },
        instructions: "Read-only public Pexly product discovery. Product pages and checkout remain on pexly.app. Never claim an order or payment was made.",
      });
    }

    if (rpc.method === "ping") return rpcResult(rpc.id, {});
    if (rpc.method === "tools/list") {
      return rpcResult(rpc.id, { tools: TOOL_DEFINITIONS });
    }
    if (rpc.method === "tools/call") {
      const params = rpc.params || {};
      return rpcResult(rpc.id, await handleToolCall(params, env));
    }
    if (rpc.method === "resources/list") {
      return rpcResult(rpc.id, {
        resources: [{
          uri: WIDGET_URI,
          name: "Pexly Shop product cards",
          description: "Product cards for Pexly public catalogue search results.",
          mimeType: "text/html;profile=mcp-app",
        }],
      });
    }
    if (rpc.method === "resources/read") {
      const params = rpc.params || {};
      if (params.uri !== WIDGET_URI) {
        return rpcError(rpc.id, -32602, "Unknown resource URI.");
      }
      return rpcResult(rpc.id, {
        contents: [{
          uri: WIDGET_URI,
          mimeType: "text/html;profile=mcp-app",
          text: WIDGET_HTML,
          _meta: {
            ui: {
              prefersBorder: true,
              domain: "https://pexly.app",
              csp: {
                connectDomains: [],
                resourceDomains: ["https://pexly.app", "https://cdn.shopify.com", "https://shopify.com"],
              },
            },
          },
        }],
      });
    }
    if (rpc.method === "prompts/list") return rpcResult(rpc.id, { prompts: [] });

    return rpcError(rpc.id, -32601, "Method not found.");
  },
};
