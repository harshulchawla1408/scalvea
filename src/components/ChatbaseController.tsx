import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ChatbaseController
 * Dynamically toggles Chatbase chatbot visibility based on current page route.
 * Allowed pages: Home ('/'), Contact ('/contact', '/support'), FAQ ('/faq', '/faqs', '/help')
 * Hidden on: Product Details, Cart, Checkout, Blogs, and all other pages.
 */
const ALLOWED_PATHS = ["/", "/contact", "/support", "/faq", "/faqs", "/help"];

export default function ChatbaseController() {
  const location = useLocation();

  useEffect(() => {
    const rawPath = location.pathname.toLowerCase();
    const normalizedPath = rawPath.endsWith("/") && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath;

    const isAllowed = ALLOWED_PATHS.includes(normalizedPath);

    if (isAllowed) {
      document.body.classList.remove("hide-chatbase");
    } else {
      document.body.classList.add("hide-chatbase");
      // Close open chat window if active
      if (typeof window !== "undefined" && typeof (window as any).chatbase === "function") {
        try {
          (window as any).chatbase("close");
        } catch {
          // ignore if close action is unhandled
        }
      }
    }
  }, [location.pathname]);

  return null;
}
