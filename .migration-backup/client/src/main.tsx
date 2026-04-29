import "@/lib/i18n";
import { setNonce } from "get-nonce";
import { createRoot } from "react-dom/client";
import { createHead, UnheadProvider } from "@unhead/react/client";
import App from "./App";
import "./index.css";

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
}
