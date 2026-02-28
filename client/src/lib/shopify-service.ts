import { supabase } from "./supabase";

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
      };
    }>;
  };
}

export const shopifyService = {
  async query(query: string, variables: any = {}) {
    const { data, error } = await supabase.functions.invoke('shopify-storefront', {
      body: { query, variables }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (data?.errors) {
      console.error('Shopify GraphQL errors:', data.errors);
      throw new Error(data.errors[0].message);
    }

    return data.data;
  },

  async getProducts(first: number = 20) {
    const query = `
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              description
              handle
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.query(query, { first });
    return data.products.edges.map((edge: any) => edge.node) as ShopifyProduct[];
  }
};
