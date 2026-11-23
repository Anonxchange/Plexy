import "@/lib/i18n";
import { setNonce } from "get-nonce";
import { createRoot } from "react-dom/client";
import { createHead, UnheadProvider } from "@unhead/react/client";
import App from "./App";
import "./styles.css";
try {
  const theme = window.localStorage.getItem("pexly-theme");
  document.documentElement.classList.add(theme === "dark" ? "dark" : "light");
} catch {
  document.documentElement.classList.add("light");
}

// The Cloudflare Worker writes the per-request CSP nonce into the `content`
// attribute of <meta property="csp-nonce"> (`content`, not `nonce`, avoids
// Chrome's nonce-hiding behaviour). Calling setNonce() here propagates it into
// get-nonce so react-style-singleton (used by Radix Dialog, Dropdown, Popover,
// Tooltip, etc.) automatically stamps the nonce onto every <style> it injects —
// eliminating CSP violations without unsafe-inline or hash maintenance.
const cspMeta = document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]');
const edgeNonce = cspMeta?.getAttribute("content");
if (edgeNonce) setNonce(edgeNonce);

const head = createHead();

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <UnheadProvider head={head}>
      <App />
    </UnheadProvider>
  );
  // Run the DOM-level translator when the browser has idle time, not during
  // the first homepage paint. It can walk a large marketing page.
  if (typeof window !== "undefined") {
    const scheduleTranslation = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => {
          void import("@/lib/auto-translate").then(({ startAutoTranslate }) => startAutoTranslate());
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          void import("@/lib/auto-translate").then(({ startAutoTranslate }) => startAutoTranslate());
        }, 500);
      }
    };
    if (document.readyState === "complete" || document.readyState === "interactive") {
      scheduleTranslation();
    } else {
      window.addEventListener("DOMContentLoaded", scheduleTranslation, { once: true });
    }
  }
}
