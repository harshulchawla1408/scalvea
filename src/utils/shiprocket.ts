/**
 * Loads the Shiprocket Headless Checkout SDK script dynamically.
 */
export const loadShiprocketScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).HeadlessCheckout) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.shiprocket.com/headless-checkout/v1/headless-checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error("Failed to load Shiprocket Checkout SDK script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
