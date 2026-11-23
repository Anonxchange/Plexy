import "@/lib/i18n";
import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from "@unhead/react/server";
import { PexlyHomepage } from "@/pages/current-html/home";
import { GiftCardsExport } from "@/pages/current-html/gift-cards";
import { GiftCardsAllPage } from "@/pages/current-html/gift-cards-all";
import { PhysicalProductsExport } from "@/pages/current-html/physical-products";
import { AboutUsExport } from "@/pages/current-html/about-us";
import { TeamsExport } from "@/pages/current-html/teams";
import { CareerExport } from "@/pages/current-html/career";
import { BlogsExport } from "@/pages/current-html/blogs";
import MobileTopup from "@/pages/mobile-topup";
import { ROUTE_SEO } from "@/components/marketing/current-marketing-page";
import { siteMetadata, buildCanonicalUrl } from "@/lib/site-document";

const pages: Record<string, React.ComponentType> = {
  "/": PexlyHomepage,
  "/gift-cards": GiftCardsExport,
  "/gift-cards/all": GiftCardsAllPage,
  "/shop": PhysicalProductsExport,
  "/mobile-topup": MobileTopup,
  "/about-us": AboutUsExport,
  "/teams": TeamsExport,
  "/career": CareerExport,
  "/blogs": BlogsExport,
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function renderSeoPage(path: string) {
  const Page = pages[path];
  if (!Page) throw new Error(`No prerender page registered for ${path}`);
  const seo = ROUTE_SEO[path] ?? ROUTE_SEO["/"];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  const head = createHead();
  const body = renderToString(
    <UnheadProvider value={head}>
      <Router ssrPath={path}>
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      </Router>
    </UnheadProvider>,
  );
  const canonical = buildCanonicalUrl(seo.canonicalPath);
  const schema = JSON.stringify(seo.schema).replaceAll("<", "\\u003c");
  const title = escapeHtml(seo.title || siteMetadata.title);
  const description = escapeHtml(seo.description || siteMetadata.description);
  return `<section id="seo-prerender" aria-label="Pexly page content">
    <script type="application/ld+json">${schema}</script>
    ${body}
  </section>
  <!-- PEXLY_SEO_TITLE:${title} -->
  <!-- PEXLY_SEO_DESCRIPTION:${description} -->
  <!-- PEXLY_SEO_CANONICAL:${canonical} -->`;
}
