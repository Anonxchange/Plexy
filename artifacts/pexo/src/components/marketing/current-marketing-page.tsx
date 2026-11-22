import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { useHead } from "@unhead/react";
import { buildCanonicalUrl } from "@/lib/site-document";
import {
  useSchema,
  homePageSchema,
  shopPageSchema,
  giftCardsPageSchema,
  giftCardsAllPageSchema,
  mobileTopupPageSchema,
  aboutPageSchema,
  teamsPageSchema,
  careerPageSchema,
  blogPageSchema,
} from "@/hooks/use-schema";
import { setupHomepageNativeInteractions } from "./homepage-native-interactions";

import "./homepage-native-interactions.css";

interface PageSeoConfig {
  title: string;
  description: string;
  canonicalPath: string;
  schema: Record<string, any>;
}

const ROUTE_SEO: Record<string, PageSeoConfig> = {
  "/": {
    title: "Pexly — Your wallet, your way to pay",
    description:
      "Spend crypto directly from your own wallet. Buy gift cards, top up mobile phones, pay utility bills, and shop global products on Pexly.",
    canonicalPath: "/",
    schema: homePageSchema,
  },
  "/shop": {
    title: "Crypto Shop — Buy Global Products with Crypto | Pexly",
    description:
      "Shop electronics, fashion, home goods, and everyday products worldwide. Pay directly with Bitcoin, Ethereum, USDT, USDC, and more on Pexly.",
    canonicalPath: "/shop",
    schema: shopPageSchema,
  },
  "/gift-cards": {
    title: "Crypto Gift Cards — Instant Digital Delivery | Pexly",
    description:
      "Buy digital gift cards for shopping, gaming, dining, and streaming using cryptocurrency. Enjoy instant delivery right from your own wallet.",
    canonicalPath: "/gift-cards",
    schema: giftCardsPageSchema,
  },
  "/gift-cards/all": {
    title: "All Gift Cards — Browse Global Brands | Pexly",
    description:
      "Explore hundreds of global gift card brands by country and category. Pay seamlessly with Bitcoin, USDT, USDC, and major cryptocurrencies.",
    canonicalPath: "/gift-cards/all",
    schema: giftCardsAllPageSchema,
  },
  "/mobile-topup": {
    title: "Mobile Top-Up with Crypto — Global Airtime & Data | Pexly",
    description:
      "Recharge prepaid mobile phones and data plans worldwide with cryptocurrency. Instant airtime top-ups across global carriers on Pexly.",
    canonicalPath: "/mobile-topup",
    schema: mobileTopupPageSchema,
  },
  "/about-us": {
    title: "About Us — Non-Custodial Crypto Commerce | Pexly",
    description:
      "Learn how Pexly enables non-custodial crypto payments for gift cards, mobile top-ups, utility bills, and global products without holding user funds.",
    canonicalPath: "/about-us",
    schema: aboutPageSchema,
  },
  "/teams": {
    title: "Our Team — People Building Pexly | Pexly",
    description:
      "Meet the engineers, designers, and operators building Pexly's non-custodial marketplace for digital services and everyday crypto commerce.",
    canonicalPath: "/teams",
    schema: teamsPageSchema,
  },
  "/career": {
    title: "Careers at Pexly — Join Our Remote Team | Pexly",
    description:
      "Explore open roles at Pexly and help build non-custodial crypto commerce tools for gift cards, global shopping, and digital payments.",
    canonicalPath: "/career",
    schema: careerPageSchema,
  },
  "/blogs": {
    title: "Pexly Blog — Crypto Commerce, Wallets & Guides",
    description:
      "Read product updates, self-custody guides, and insights on spending cryptocurrency for gift cards, utility bills, and everyday shopping.",
    canonicalPath: "/blogs",
    schema: blogPageSchema,
  },
};

type CurrentMarketingPageProps = {
  page: string;
  children: React.ReactNode;
};

function revealElement(element: HTMLElement) {
  const computed = window.getComputedStyle(element);
  if (Number.parseFloat(computed.opacity) < 0.99 || (computed.filter && computed.filter !== "none")) {
    element.style.transition = "opacity .6s ease, filter .6s ease";
    element.style.setProperty("opacity", "1", "important");
    element.style.setProperty("filter", "none", "important");
    if (!/splide|swiper/.test(`${element.className}`) && computed.transform !== "none") {
      element.style.transition += ", transform .6s ease";
      element.style.setProperty("transform", "none", "important");
    }
  }
}

function activateTab(tabGroup: HTMLElement, selectedTab: string) {
  const links = Array.from(tabGroup.querySelectorAll<HTMLElement>(".w-tab-link[data-w-tab]"));
  if (!links.some((link) => link.dataset.wTab === selectedTab)) return;

  tabGroup.dataset.current = selectedTab;
  links.forEach((link) => {
    const active = link.dataset.wTab === selectedTab;
    link.classList.toggle("w--current", active);
    link.setAttribute("aria-selected", String(active));
    link.tabIndex = active ? 0 : -1;
  });

  tabGroup.querySelectorAll<HTMLElement>(".w-tab-pane[data-w-tab]").forEach((pane) => {
    const active = pane.dataset.wTab === selectedTab;
    pane.classList.toggle("w--tab-active", active);
    pane.hidden = !active;
    pane.setAttribute("aria-hidden", String(!active));
  });
}

function initializeTabs(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".w-tabs").forEach((tabGroup) => {
    const links = Array.from(tabGroup.querySelectorAll<HTMLElement>(".w-tab-link[data-w-tab]"));
    const currentTab = tabGroup.dataset.current;
    const selectedTab =
      (currentTab && links.some((link) => link.dataset.wTab === currentTab) ? currentTab : undefined) ??
      links.find((link) => link.classList.contains("w--current"))?.dataset.wTab ??
      links[0]?.dataset.wTab;

    if (selectedTab) activateTab(tabGroup, selectedTab);
  });
}

function handlePageClick(event: MouseEvent<HTMLDivElement>, setLocation: (path: string) => void) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  // Exported source pages retain their copied chrome markup for provenance,
  // but it is hidden and inert; AppHeader owns all navigation interactions.
  if (target.closest(".px-nav")) return;

  const internalLink = target.closest<HTMLAnchorElement>("a[href^='/']");
  const href = internalLink?.getAttribute("href");
  if (internalLink && href && !href.startsWith("//")) {
    event.preventDefault();
    setLocation(href);
    return;
  }

  const clickedFaqItem = target.closest<HTMLElement>(".faq-item");
  if (!clickedFaqItem) {
    event.currentTarget.querySelectorAll<HTMLElement>(".faq-item.w--open").forEach((item) => {
      item.classList.remove("w--open");
      item.querySelector(".faq-question-block")?.setAttribute("aria-expanded", "false");
      const answer = item.querySelector<HTMLElement>(".faq-ans-block");
      answer?.classList.remove("w--open");
      if (answer) answer.hidden = true;
    });
  }

  const dropdownToggle = target.closest<HTMLElement>(".w-dropdown-toggle");
  if (dropdownToggle) {
    const dropdown = dropdownToggle.closest<HTMLElement>(".w-dropdown");
    const open = !dropdown?.classList.contains("w--open");
    const faqGroup = dropdown?.closest<HTMLElement>(".faq-qa-wrapper");
    faqGroup?.querySelectorAll<HTMLElement>(".faq-item.w--open").forEach((item) => {
      if (item === dropdown) return;
      item.classList.remove("w--open");
      item.querySelector(".faq-question-block")?.setAttribute("aria-expanded", "false");
      const answer = item.querySelector<HTMLElement>(".faq-ans-block");
      answer?.classList.remove("w--open");
      if (answer) answer.hidden = true;
    });
    dropdown?.classList.toggle("w--open", open);
    const answer = dropdown?.querySelector<HTMLElement>(".w-dropdown-list");
    answer?.classList.toggle("w--open", open);
    if (answer) answer.hidden = !open;
    dropdownToggle.setAttribute("aria-expanded", String(open));
    return;
  }

  const tab = target.closest<HTMLElement>("[data-w-tab]");
  const tabGroup = tab?.closest<HTMLElement>(".w-tabs");
  if (tab && tabGroup && !tab.classList.contains("w-tab-pane")) {
    event.preventDefault();
    const selected = tab.dataset.wTab;
    if (selected) activateTab(tabGroup, selected);
    return;
  }

  const filter = target.closest<HTMLButtonElement>("button[data-f]");
  if (filter) {
    const section = filter.closest<HTMLElement>("section");
    const cards = section?.querySelectorAll<HTMLElement>(".sp-card");
    if (!cards?.length) return;
    const value = filter.dataset.f ?? "all";
    section?.querySelectorAll<HTMLButtonElement>("button[data-f]").forEach((button) => {
      const active = button === filter;
      button.classList.toggle("on", active);
      button.setAttribute("aria-pressed", String(active));
    });
    cards.forEach((card) => {
      const text = card.textContent?.toLowerCase() ?? "";
      const price = Number(text.match(/\$\s*(\d+(?:\.\d+)?)/)?.[1] ?? Number.NaN);
      const visible =
        value === "all" ||
        (value === "popular" && /popular|best seller|hot/.test(text)) ||
        (value === "fast" && /fast|shipping/.test(text)) ||
        (value === "under50" && Number.isFinite(price) && price < 50) ||
        (value === "new" && /\bnew\b/.test(text));
      card.classList.toggle("hide", !visible);
    });
    event.preventDefault();
    return;
  }

  const anchor = target.closest<HTMLAnchorElement>("a[href='#']");
  if (anchor && anchor.textContent?.trim().toLowerCase() === "shuffle") {
    const section = anchor.closest("section");
    const row = section?.querySelector<HTMLElement>(".sp-row, .sp-list, .sp-track, .sp-cards");
    if (row) {
      const cards = Array.from(row.children);
      if (cards.length > 1) {
        const shift = 1 + Math.floor(Math.random() * (cards.length - 1));
        cards.slice(shift).concat(cards.slice(0, shift)).forEach((card) => row.appendChild(card));
      }
      event.preventDefault();
    }
  }
}

function handlePageKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const tab = target.closest<HTMLElement>(".w-tab-link[data-w-tab]");
  if (tab) {
    const tabGroup = tab.closest<HTMLElement>(".w-tabs");
    const tabs = Array.from(
      tabGroup?.querySelectorAll<HTMLElement>(".w-tab-link[data-w-tab]") ?? [],
    );
    const index = tabs.indexOf(tab);
    if (index < 0 || tabs.length === 0) return;

    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    if (nextIndex !== undefined) {
      event.preventDefault();
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      tab.click();
      return;
    }
  }

  const faqToggle = target.closest<HTMLElement>(".faq-question-block.w-dropdown-toggle");
  if (faqToggle && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    faqToggle.click();
  }
}

export function CurrentMarketingPage({ page, children }: CurrentMarketingPageProps) {
  const [location, setLocation] = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedPath = location.split("?")[0] || "/";
  const seo =
    ROUTE_SEO[normalizedPath] ??
    ROUTE_SEO[page === "physical-products" ? "/shop" : page === "home" ? "/" : `/${page}`] ??
    ROUTE_SEO["/"];
  const canonical = buildCanonicalUrl(seo.canonicalPath);

  useHead({
    title: seo.title,
    meta: [
      { name: "description", content: seo.description },
      { property: "og:title", content: seo.title },
      { property: "og:description", content: seo.description },
      { property: "og:url", content: canonical },
      { name: "twitter:title", content: seo.title },
      { name: "twitter:description", content: seo.description },
    ],
    link: [{ rel: "canonical", key: "canonical", href: canonical }],
  });
  useSchema(seo.schema, "page-schema");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let disposed = false;
    let lottieModulePromise:
      | Promise<typeof import("lottie-web/build/player/lottie_light.js")>
      | undefined;
    const animations: Array<{ destroy: () => void }> = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    initializeTabs(root);
    const homepageCleanup =
      page === "home" ? setupHomepageNativeInteractions(root, reducedMotion) : undefined;

    const animationElements = Array.from(
      root.querySelectorAll<HTMLElement>('[data-animation-type="lottie"][data-src]'),
    );

    const loadAnimation = async (element: HTMLElement) => {
      const source = element.dataset.src;
      if (!source || disposed) return;
      const path = source.startsWith("/") ? source : `/${source.replace(/^\.?\//, "")}`;
      try {
        lottieModulePromise ??= import("lottie-web/build/player/lottie_light.js");
        const { default: lottie } = await lottieModulePromise;
        if (disposed || !element.isConnected) return;
        const animation = lottie.loadAnimation({
          container: element,
          renderer: element.dataset.renderer === "canvas" ? "canvas" : "svg",
          path,
          loop: element.dataset.loop === "1",
          autoplay: !reducedMotion && element.dataset.autoplay !== "0",
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
        });
        if (element.dataset.direction === "-1") animation.setDirection(-1);
        animations.push(animation);
      } catch (error) {
        console.error("Could not load a marketing animation.", error);
      }
    };

    let animationObserver: IntersectionObserver | undefined;
    let animationFallbackTimer: ReturnType<typeof setTimeout> | undefined;
    if ("IntersectionObserver" in window) {
      animationObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animationObserver?.unobserve(entry.target);
          void loadAnimation(entry.target as HTMLElement);
        });
      }, { rootMargin: "240px 0px" });
      animationElements.forEach((element) => animationObserver?.observe(element));
    } else if (animationElements.length > 0) {
      animationFallbackTimer = setTimeout(() => {
        animationElements.forEach((element) => void loadAnimation(element));
      }, 1000);
    }

    const hidden = Array.from(root.querySelectorAll<HTMLElement>("[data-w-id]")).filter((element) => {
      const style = window.getComputedStyle(element);
      return Number.parseFloat(style.opacity) < 0.99 || (style.filter && style.filter !== "none");
    });

    let observer: IntersectionObserver | undefined;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      hidden.forEach(revealElement);
    } else {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealElement(entry.target as HTMLElement);
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      observer = revealObserver;
      hidden.forEach((element) => revealObserver.observe(element));
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      animationObserver?.disconnect();
      if (animationFallbackTimer !== undefined) window.clearTimeout(animationFallbackTimer);
      animations.forEach((animation) => animation.destroy());
      homepageCleanup?.();
    };
  }, [page]);

  return (
    <div
      ref={rootRef}
      className={`export-page current-source-page current-source-page-${page}${page === "home" ? " w-mod-js" : ""}`}
      data-current-source-page={page}
      onClick={(event) => handlePageClick(event, setLocation)}
      onKeyDown={handlePageKeyDown}
    >
      {children}
    </div>
  );
}
