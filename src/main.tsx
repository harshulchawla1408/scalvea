import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;

// If the root element already has content it means vite-prerender.mjs has
// injected server-rendered HTML — hydrate instead of re-creating the DOM.
if (rootEl.innerHTML.trim()) {
  hydrateRoot(rootEl, <App />);
} else {
  createRoot(rootEl).render(<App />);
}
