import {
  shopifyService,
  MARKET_CHANGED_EVENT,
  type ShopifyProduct,
} from "./shopify-service";

export interface ShopifyCollectionSummary {
  id: string;
  title: string;
  handle: string;
  description?: string;
  image?: {
    url: string;
    altText?: string | null;
  } | null;
}

export interface CollectionTagTile {
  tag: string;
  label: string;
  image?: string;
  alt: string;
  count: number;
}

export interface CollectionProductTypeGroup {
  productType: string;
  image?: string;
  tags: CollectionTagTile[];
  productCount: number;
}

export interface CollectionCatalog {
  collection: ShopifyCollectionSummary | null;
  products: ShopifyProduct[];
  groups: CollectionProductTypeGroup[];
  allTags: CollectionTagTile[];
  productTypes: string[];
}

const COLLECTIONS_TTL_MS = 180_000;
let collectionsPromise: Promise<ShopifyCollectionSummary[]> | null = null;
let collectionsExpiresAt = 0;

const collectionCatalogCache = new Map<string, Promise<CollectionCatalog>>();

if (typeof window !== "undefined") {
  window.addEventListener(MARKET_CHANGED_EVENT, () => {
    collectionsPromise = null;
    collectionsExpiresAt = 0;
    collectionCatalogCache.clear();
  });
}

export function clearShopCollectionCache(): void {
  collectionsPromise = null;
  collectionsExpiresAt = 0;
  collectionCatalogCache.clear();
}

export async function fetchAllCollections(): Promise<ShopifyCollectionSummary[]> {
  if (collectionsPromise && Date.now() < collectionsExpiresAt) {
    return collectionsPromise;
  }

  collectionsExpiresAt = Date.now() + COLLECTIONS_TTL_MS;
  collectionsPromise = (async () => {
    const out: ShopifyCollectionSummary[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;

    for (let page = 0; page < 10; page += 1) {
      const res = await shopifyService.getCollections(50, cursor);
      const edges: Array<{ node?: any }> = Array.isArray(res.collections) ? res.collections : [];
      for (const edge of edges) {
        const node = edge?.node;
        if (!node?.handle || seen.has(node.handle)) continue;
        seen.add(node.handle);
        out.push({
          id: String(node.id || node.handle),
          title: String(node.title || node.handle),
          handle: String(node.handle),
          description: typeof node.description === "string" ? node.description : undefined,
          image: node.image?.url
            ? { url: String(node.image.url), altText: node.image.altText ?? null }
            : null,
        });
      }
      if (!res.pageInfo?.hasNextPage || !res.pageInfo?.endCursor) break;
      cursor = res.pageInfo.endCursor;
    }

    return out;
  })();

  collectionsPromise.catch(() => {
    collectionsPromise = null;
    collectionsExpiresAt = 0;
  });

  return collectionsPromise;
}

function firstImageOf(product: ShopifyProduct): { url?: string; alt: string } {
  const img = product.node.images?.edges?.[0]?.node;
  return {
    url: img?.url,
    alt: img?.altText || product.node.title || "",
  };
}

export function buildCollectionCatalog(
  collection: ShopifyCollectionSummary | null,
  products: ShopifyProduct[],
): CollectionCatalog {
  const typeBuckets = new Map<
    string,
    {
      displayType: string;
      firstImage?: string;
      productCount: number;
      tagMap: Map<string, CollectionTagTile>;
    }
  >();

  const globalTagMap = new Map<string, CollectionTagTile>();

  for (const product of products) {
    const node = product.node;
    const rawType = (node.productType || "").trim();
    const displayType = rawType || collection?.title || "Products";
    const typeKey = displayType.toLocaleLowerCase();
    const { url: prodImg, alt: prodAlt } = firstImageOf(product);

    let bucket = typeBuckets.get(typeKey);
    if (!bucket) {
      bucket = {
        displayType,
        firstImage: prodImg || collection?.image?.url,
        productCount: 0,
        tagMap: new Map(),
      };
      typeBuckets.set(typeKey, bucket);
    }
    bucket.productCount += 1;
    if (!bucket.firstImage && prodImg) {
      bucket.firstImage = prodImg;
    }

    const rawTags = Array.isArray(node.tags)
      ? node.tags.map((t) => String(t).trim()).filter(Boolean)
      : [];

    if (rawTags.length === 0) {
      const existing = bucket.tagMap.get("__all__");
      if (existing) {
        existing.count += 1;
        if (!existing.image && prodImg) {
          existing.image = prodImg;
          existing.alt = prodAlt;
        }
      } else {
        bucket.tagMap.set("__all__", {
          tag: "",
          label: displayType,
          image: prodImg || collection?.image?.url,
          alt: prodAlt || displayType,
          count: 1,
        });
      }
    } else {
      for (const tag of rawTags) {
        const tagKey = tag.toLocaleLowerCase();

        const typeTag = bucket.tagMap.get(tagKey);
        if (typeTag) {
          typeTag.count += 1;
          if (!typeTag.image && prodImg) {
            typeTag.image = prodImg;
            typeTag.alt = prodAlt || tag;
          }
        } else {
          bucket.tagMap.set(tagKey, {
            tag,
            label: tag,
            image: prodImg || collection?.image?.url,
            alt: prodAlt || tag,
            count: 1,
          });
        }

        const globalTag = globalTagMap.get(tagKey);
        if (globalTag) {
          globalTag.count += 1;
          if (!globalTag.image && prodImg) {
            globalTag.image = prodImg;
            globalTag.alt = prodAlt || tag;
          }
        } else {
          globalTagMap.set(tagKey, {
            tag,
            label: tag,
            image: prodImg || collection?.image?.url,
            alt: prodAlt || tag,
            count: 1,
          });
        }
      }
    }
  }

  const groups: CollectionProductTypeGroup[] = Array.from(typeBuckets.values())
    .sort((a, b) => b.productCount - a.productCount || a.displayType.localeCompare(b.displayType))
    .map((bucket) => ({
      productType: bucket.displayType,
      image: bucket.firstImage,
      productCount: bucket.productCount,
      tags: Array.from(bucket.tagMap.values()).sort(
        (a, b) => b.count - a.count || a.label.localeCompare(b.label),
      ),
    }));

  const allTags = Array.from(globalTagMap.values()).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );

  const productTypes = groups.map((g) => g.productType);

  return {
    collection,
    products,
    groups,
    allTags,
    productTypes,
  };
}

export async function fetchCollectionCatalog(handle: string): Promise<CollectionCatalog> {
  const key = handle.trim();
  const cached = collectionCatalogCache.get(key);
  if (cached) return cached;

  const job = (async (): Promise<CollectionCatalog> => {
    const allProducts: ShopifyProduct[] = [];
    const seenIds = new Set<string>();
    let collectionMeta: ShopifyCollectionSummary | null = null;
    let cursor: string | undefined;

    for (let page = 0; page < 4; page += 1) {
      const res = await shopifyService.getCollectionProducts(key, 250, cursor);
      if (res.collection && !collectionMeta) {
        collectionMeta = {
          id: String(res.collection.id || key),
          title: String(res.collection.title || key),
          handle: String(res.collection.handle || key),
          description: res.collection.description,
          image: res.collection.image?.url
            ? { url: String(res.collection.image.url), altText: res.collection.image.altText ?? null }
            : null,
        };
      }
      const edges: ShopifyProduct[] = Array.isArray(res.products) ? res.products : [];
      for (const edge of edges) {
        const id = edge?.node?.id;
        if (!id || seenIds.has(id)) continue;
        seenIds.add(id);
        allProducts.push(edge);
      }
      if (!res.pageInfo?.hasNextPage || !res.pageInfo?.endCursor) break;
      cursor = res.pageInfo.endCursor;
    }

    return buildCollectionCatalog(collectionMeta, allProducts);
  })();

  collectionCatalogCache.set(key, job);
  job.catch(() => {
    if (collectionCatalogCache.get(key) === job) {
      collectionCatalogCache.delete(key);
    }
  });

  return job;
}
