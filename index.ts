// Supabase Edge Function: pexly-shop-mcp
// Minimal stateless MCP Streamable HTTP endpoint for public product discovery.
// No Shopify credentials are read or returned by this function.

const DEFAULT_STOREFRONT_URL =
  "https://hvpeycnedmzrjshmvgri.supabase.co/functions/v1/shopify-storefront";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id, authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "MCP-Session-Id, MCP-Protocol-Version",
};

const SERVER_INFO = { name: "pexly-shop-mcp", version: "0.1.0" };
const DEFAULT_PROTOCOL_VERSION = "2025-03-26";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown,
) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  };
}

function textContent(value: unknown) {
  return [{ type: "text", text: JSON.stringify(value) }];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringArg(args: Record<string, unknown>, name: string, max: number): string {
  const value = args[name];
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new Error(`Invalid ${name}: expected a non-empty string up to ${max} characters.`);
  }
  return value.trim();
}

function boundedInt(value: unknown, fallback: number, min: number, max: number): number {
  if (value === undefined || value === null) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Expected an integer between ${min} and ${max}.`);
  }
  return parsed;
}

async function callStorefront(queryName: string, variables: Record<string, unknown>) {
  const endpoint = Deno.env.get("SHOPIFY_STOREFRONT_FUNCTION_URL") ||
    DEFAULT_STOREFRONT_URL;

  // Only known operation names are passed by this function; never accept an
  // arbitrary upstream query or URL from tool arguments.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ queryName, variables }),
      signal: controller.signal,
    });
    const raw = await response.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(`Storefront endpoint returned non-JSON (HTTP ${response.status}).`);
    }
    if (!response.ok) {
      throw new Error(`Storefront endpoint returned HTTP ${response.status}.`);
    }
    const record = asRecord(data);
    if (record.error) {
      const message = typeof record.error === "string"
        ? record.error
        : "Storefront request failed.";
      throw new Error(message);
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Storefront request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function unwrapProducts(data: unknown): unknown[] {
  const root = asRecord(data);
  const candidates: unknown[] = [
    root.products,
    asRecord(root.data).products,
    asRecord(root.result).products,
    asRecord(asRecord(root.data).products).nodes,
    asRecord(asRecord(root.data).products).edges,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map((item) => {
        const row = asRecord(item);
        return row.node && typeof row.node === "object" ? row.node : item;
      });
    }
  }
  if (Array.isArray(root.data)) return root.data;
  return [];
}

function normalizeProduct(raw: unknown) {
  const p = asRecord(raw);
  const variantsRoot = asRecord(p.variants);
  const variantNodes = Array.isArray(variantsRoot.nodes)
    ? variantsRoot.nodes
    : Array.isArray(variantsRoot.edges)
    ? variantsRoot.edges.map((e) => asRecord(e).node)
    : Array.isArray(p.variants)
    ? p.variants
    : [];
  const firstVariant = asRecord(variantNodes[0]);
  const priceObj = asRecord(p.priceRange);
  const minPrice = asRecord(priceObj.minVariantPrice);
  const directPrice = asRecord(p.price);
  const imageObj = asRecord(p.featuredImage);
  const images = asRecord(p.images);
  const imageEdges = Array.isArray(images.edges) ? images.edges : [];
  const firstImage = asRecord(asRecord(imageEdges[0]).node);
  const imageArrayFirst = Array.isArray(p.images) ? asRecord(p.images[0]) : {};
  const image =
    (typeof p.image === "string" ? p.image : undefined) ||
    (typeof imageObj.url === "string" ? imageObj.url : undefined) ||
    (typeof imageObj.src === "string" ? imageObj.src : undefined) ||
    (typeof firstImage.url === "string" ? firstImage.url : undefined) ||
    (typeof firstImage.src === "string" ? firstImage.src : undefined) ||
    (typeof imageArrayFirst.url === "string" ? imageArrayFirst.url : undefined) ||
    (typeof imageArrayFirst.src === "string" ? imageArrayFirst.src : undefined);
  const price =
    (typeof directPrice.amount === "string" || typeof directPrice.amount === "number"
      ? directPrice.amount
      : undefined) ??
    (typeof p.price === "string" || typeof p.price === "number" ? p.price : undefined) ??
    (typeof minPrice.amount === "string" || typeof minPrice.amount === "number"
      ? minPrice.amount
      : undefined) ??
    (typeof firstVariant.price === "string" || typeof firstVariant.price === "number"
      ? firstVariant.price
      : undefined);
  const currency =
    (typeof directPrice.currencyCode === "string" ? directPrice.currencyCode : undefined) ||
    (typeof minPrice.currencyCode === "string" ? minPrice.currencyCode : undefined) ||
    (typeof p.currencyCode === "string" ? p.currencyCode : undefined);
  const handle = typeof p.handle === "string" ? p.handle : undefined;
  const productUrl =
    (typeof p.onlineStoreUrl === "string" ? p.onlineStoreUrl : undefined) ||
    (typeof p.url === "string" ? p.url : undefined) ||
    (handle ? `https://pexly.app/products/${encodeURIComponent(handle)}` : undefined);

  return {
    id: typeof p.id === "string" ? p.id : undefined,
    title: typeof p.title === "string" ? p.title : "Untitled product",
    handle,
    description: typeof p.description === "string"
      ? p.description
      : typeof p.descriptionHtml === "string"
      ? p.descriptionHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      : undefined,
    productType: typeof p.productType === "string" ? p.productType : undefined,
    tags: Array.isArray(p.tags) ? p.tags.filter((tag): tag is string => typeof tag === "string") : [],
    price,
    currency,
    availableForSale: typeof p.availableForSale === "boolean"
      ? p.availableForSale
      : typeof p.available === "boolean"
      ? p.available
      : undefined,
    image,
    url: productUrl,
  };
}

function categoryIntent(query: string): "shirts" | "shoes" | "trousers" | null {
  const q = query.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  if (/\b(t-?shirts?|tees?|polo shirts?|button[- ]?down shirts?|blouses?)\b/.test(q)) return "shirts";
  if (/\b(shoes?|sneakers?|trainers?|boots?|sandals?|slippers?|footwear)\b/.test(q)) return "shoes";
  if (/\b(trousers?|pants?|jeans?|joggers?|leggings?|shorts?|chinos?)\b/.test(q)) return "trousers";
  return null;
}

function matchesCategory(product: ReturnType<typeof normalizeProduct>, category: "shirts" | "shoes" | "trousers"): boolean {
  const title = product.title.toLowerCase();
  const metadata = [product.productType || "", ...product.tags].join(" ").toLowerCase();
  if (category === "shirts") return /\b(t-?shirts?|tees?|polo shirts?|button[- ]?down shirts?|blouses?)\b/.test(title + " " + metadata);
  if (category === "shoes") return /\b(shoes?|sneakers?|trainers?|boots?|sandals?|slippers?|footwear)\b/.test(title + " " + metadata);
  return /\b(trousers?|pants?|jeans?|joggers?|leggings?|shorts?|chinos?)\b/.test(title + " " + metadata);
}

const TOOLS = [
  {
    name: "search_products",
    description:
      "Search Pexly's public Shopify catalogue for physical products. Use a short search phrase and optional result limit.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Product name or search phrase (1–120 characters)." },
        limit: { type: "integer", minimum: 1, maximum: 10, default: 5 },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_product",
    description: "Get public details for one Pexly product by its Shopify handle.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string", description: "Shopify product handle." },
      },
      required: ["handle"],
      additionalProperties: false,
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>) {
  if (name === "search_products") {
    const query = stringArg(args, "query", 120);
    const limit = boundedInt(args.limit, 5, 1, 10);

    // Contract assumption: shopify-storefront uses queryName/variables and
    // recognizes getProducts with search/first. Change only this adapter if
    // the deployed function uses different argument names.
    const upstream = await callStorefront("getProducts", {
      query,
      search: query,
      first: limit,
      limit,
    });
    const normalized = unwrapProducts(upstream).map(normalizeProduct);
    const category = categoryIntent(query);
    const relevant = category ? normalized.filter((product) => matchesCategory(product, category)) : normalized;
    const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
    const products = relevant
      .map((product, index) => ({
        product,
        index,
        score: terms.reduce((score, term) => score + (product.title.toLowerCase().includes(term) ? 3 : 0), 0),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, limit)
      .map((item) => item.product);
    return {
      query,
      count: products.length,
      products,
      note: products.length
        ? undefined
        : category
        ? `No matching ${category} were found in the returned catalogue results. Try a more specific search or verify the Shopify search query.`
        : "No products were returned. Verify the getProducts queryName and variables contract in shopify-storefront.",
    };
  }

  if (name === "get_product") {
    const handle = stringArg(args, "handle", 160);
    // Contract assumption: shopify-storefront recognizes getProductByHandle.
    const upstream = await callStorefront("getProductByHandle", { handle });
    const root = asRecord(upstream);
    const product =
      root.product ??
      asRecord(root.data).product ??
      asRecord(root.result).product ??
      (typeof root.handle === "string" ? upstream : undefined);
    if (!product) {
      return {
        found: false,
        handle,
        note: "No product was returned. Verify the getProductByHandle queryName and response shape in shopify-storefront.",
      };
    }
    return { found: true, product: normalizeProduct(product) };
  }

  throw new Error(`Unknown tool: ${name}`);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method === "GET") {
    // Health endpoint only; MCP clients should send JSON-RPC POST requests.
    return json({
      name: SERVER_INFO.name,
      status: "ok",
      protocol: "MCP Streamable HTTP",
      tools: TOOLS.map((tool) => tool.name),
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed. Use POST for MCP JSON-RPC." }, 405);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "Content-Type must be application/json." }, 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400);
  }

  if (Array.isArray(body)) {
    // Batch requests are deliberately rejected to keep behavior simple and predictable.
    return json(rpcError(null, -32600, "Batch requests are not supported."), 400);
  }

  const rpc = asRecord(body) as JsonRpcRequest;
  if (rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string") {
    return json(rpcError(rpc.id, -32600, "Invalid Request"), 400);
  }

  const protocolHeader = request.headers.get("mcp-protocol-version");
  const responseHeaders: Record<string, string> = {
    "MCP-Protocol-Version": protocolHeader || DEFAULT_PROTOCOL_VERSION,
  };

  try {
    if (rpc.method === "notifications/initialized" ||
        rpc.method === "notifications/cancelled" ||
        rpc.method === "notifications/progress") {
      return new Response(null, { status: 202, headers: corsHeaders });
    }

    if (rpc.method === "initialize") {
      const requestedVersion = asRecord(rpc.params).protocolVersion;
      const protocolVersion = typeof requestedVersion === "string"
        ? requestedVersion
        : DEFAULT_PROTOCOL_VERSION;
      return json(rpcResult(rpc.id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Pexly Shop provides public product discovery. Search products before recommending an item. Product checkout and crypto payment are handled separately on Pexly.",
      }), 200, responseHeaders);
    }

    if (rpc.method === "ping") {
      return json(rpcResult(rpc.id, {}), 200, responseHeaders);
    }

    if (rpc.method === "tools/list") {
      return json(rpcResult(rpc.id, { tools: TOOLS }), 200, responseHeaders);
    }

    if (rpc.method === "tools/call") {
      const params = asRecord(rpc.params);
      const name = typeof params.name === "string" ? params.name : "";
      const args = asRecord(params.arguments);
      try {
        const result = await callTool(name, args);
        return json(rpcResult(rpc.id, {
          content: textContent(result),
          structuredContent: result,
          isError: false,
        }), 200, responseHeaders);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool call failed.";
        return json(rpcResult(rpc.id, {
          content: [{ type: "text", text: message }],
          isError: true,
        }), 200, responseHeaders);
      }
    }

    return json(rpcError(rpc.id, -32601, `Method not found: ${rpc.method}`), 200, responseHeaders);
  } catch {
    return json(rpcError(rpc.id, -32603, "Internal error"), 200, responseHeaders);
  }
});
