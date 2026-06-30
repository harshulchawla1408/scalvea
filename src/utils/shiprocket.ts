export const loadShiprocketAssets = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).HeadlessCheckout) {
      resolve(true);
      return;
    }

    // CSS
    if (!document.getElementById("shiprocket-css")) {
      const css = document.createElement("link");
      css.id = "shiprocket-css";
      css.rel = "stylesheet";
      css.href =
        "https://checkout-ui.shiprocket.com/assets/styles/shopify.css";
      document.head.appendChild(css);
    }

    // JS
    const script = document.createElement("script");
    script.id = "shiprocket-js";
    script.src =
      "https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js";
    script.async = true;

    script.onload = () => {
      console.log("Shiprocket SDK loaded");
      resolve(true);
    };

    script.onerror = () => {
      console.error("Shiprocket SDK failed");
      resolve(false);
    };

    document.body.appendChild(script);
  });
};