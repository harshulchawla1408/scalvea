export const launchShiprocketCheckout = (event: Event | any, token: string, fallbackUrl: string): void => {
  if (!token) {
    console.error("No Shiprocket token provided. Aborting checkout.");
    return;
  }

  const loadAssetsAndLaunch = () => {
    return new Promise<boolean>((resolve) => {
      let cssLoaded = false;
      let jsLoaded = false;

      // 1. Check/Load CSS
      if (!document.getElementById("shiprocket-shopify-css")) {
        const css = document.createElement("link");
        css.id = "shiprocket-shopify-css";
        css.rel = "stylesheet";
        css.href = "https://checkout-ui.shiprocket.com/assets/styles/shopify.css";
        css.onload = () => { cssLoaded = true; checkAndLaunch(); };
        css.onerror = () => { cssLoaded = true; checkAndLaunch(); }; // Proceed even if CSS fails
        document.head.appendChild(css);
      } else {
        cssLoaded = true;
      }

      // 2. Check/Load JS
      if (!document.getElementById("shiprocket-shopify-js")) {
        const script = document.createElement("script");
        script.id = "shiprocket-shopify-js";
        script.src = "https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js";
        script.async = true;
        
        script.onload = () => { jsLoaded = true; checkAndLaunch(); };
        script.onerror = () => { 
          console.error("Unable to load Shiprocket Checkout JS. Please try again.");
          resolve(false); 
        };
        
        document.body.appendChild(script);
      } else {
        jsLoaded = true;
        checkAndLaunch();
      }

      function checkAndLaunch() {
        if (!cssLoaded || !jsLoaded) return;

        // Poll for window.HeadlessCheckout
        let attempts = 0;
        const poll = setInterval(() => {
          attempts++;
          if ((window as any).HeadlessCheckout && typeof (window as any).HeadlessCheckout.addToCart === "function") {
            clearInterval(poll);
            
            // Launch the checkout
            try {
              (window as any).HeadlessCheckout.addToCart(event, token, {
                fallbackUrl,
                isInitiatedFromApp: false
              });
              resolve(true);
            } catch (err) {
              console.error("Shiprocket SDK error:", err);
              resolve(false);
            }
          } else if (attempts >= 50) { // 5 second timeout
            clearInterval(poll);
            console.error("HeadlessCheckout unavailable after timeout. Graceful error.");
            resolve(false);
          }
        }, 100);
      }
    });
  };

  loadAssetsAndLaunch().then(success => {
    if (!success) {
      alert("Unable to load Shiprocket Checkout. Please try again.");
    }
  });
};
