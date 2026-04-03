import "@/lib/i18n";
import { setNonce } from "get-nonce";
import { createRoot } from "react-dom/client";
import { createHead, UnheadProvider } from "@unhead/react/client";
import App from "./App";
import "./index.css";

// Propagate the CSP nonce from the edge-stamped <meta property="csp-nonce">
// into get-nonce so react-style-singleton (used by Radix Dialog, Dropdown,
// Popover, Tooltip, etc.) stamps the same nonce onto every <style> it injects
// at runtime — eliminating CSP violations without needing unsafe-inline or
// maintaining a list of content hashes.
const cspMeta = document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]');
const edgeNonce = cspMeta?.getAttribute("nonce");
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
