import { createRoot } from "react-dom/client";
import { createHead, UnheadProvider } from "@unhead/react/client";
import App from "./App";
import "./index.css";

const head = createHead();

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <UnheadProvider head={head}>
      <App />
    </UnheadProvider>
  );
}
