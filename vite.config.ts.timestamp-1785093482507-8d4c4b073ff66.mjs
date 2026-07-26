// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/React/scalvea/node_modules/vite/dist/node/index.js";
import react from "file:///C:/React/scalvea/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/React/scalvea/node_modules/lovable-tagger/dist/index.js";
import sitemap from "file:///C:/React/scalvea/node_modules/vite-plugin-sitemap/dist/index.js";
var __vite_injected_original_dirname = "C:\\React\\scalvea";
async function getDynamicRoutes(env) {
  const routes = [
    "/shop",
    "/about",
    "/contact",
    "/support",
    "/faqs",
    "/shipping-returns",
    "/privacy-policy",
    "/terms-of-service",
    "/shipping-policy",
    "/returns-policy",
    "/faq"
  ];
  const staticProducts = [
    "follicle-8-hair-growth-serum",
    "hair-growth-serum-black-edition",
    "follicle-8-spray-serum"
  ];
  staticProducts.forEach((slug) => {
    routes.push(`/product/${slug}`);
  });
  const staticCategories = ["Serums", "Sprays"];
  staticCategories.forEach((cat) => {
    routes.push(`/shop?category=${encodeURIComponent(cat)}`);
  });
  try {
    const supabaseUrl = env.VITE_SUPABASE_URL || "https://dtehgajreecaonqalxlf.supabase.co";
    const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_DAFWNN0PB8JNNBIP3c8CBw_gyVRijeE";
    if (supabaseUrl && supabaseKey) {
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=slug,category,is_active_australia,is_active_india`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const products = await response.json();
        if (Array.isArray(products) && products.length > 0) {
          const activeProducts = products.filter((p) => (p.is_active_australia ?? true) || (p.is_active_india ?? true));
          activeProducts.forEach((p) => {
            if (p.slug) {
              routes.push(`/product/${p.slug}`);
            }
          });
          const categories = [...new Set(activeProducts.map((p) => p.category).filter(Boolean))];
          categories.forEach((cat) => {
            routes.push(`/shop?category=${encodeURIComponent(cat)}`);
          });
        }
      }
    }
  } catch (error) {
    console.warn("Could not fetch products from Supabase during build:", error);
  }
  return [...new Set(routes)];
}
var vite_config_default = defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const dynamicRoutes = await getDynamicRoutes(env);
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      sitemap({
        hostname: "https://scalvea.com",
        dynamicRoutes,
        exclude: ["/admin", "/account", "/checkout", "/cart", "/wishlist", "/auth"]
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxSZWFjdFxcXFxzY2FsdmVhXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxSZWFjdFxcXFxzY2FsdmVhXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9SZWFjdC9zY2FsdmVhL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCBzaXRlbWFwIGZyb20gJ3ZpdGUtcGx1Z2luLXNpdGVtYXAnO1xyXG5cclxuLy8gSGVscGVyIHRvIGZldGNoIGR5bmFtaWMgcm91dGVzIGZvciBwcm9kdWN0cyBhbmQgY2F0ZWdvcmllcyBmcm9tIFN1cGFiYXNlXHJcbmFzeW5jIGZ1bmN0aW9uIGdldER5bmFtaWNSb3V0ZXMoZW52OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XHJcbiAgY29uc3Qgcm91dGVzID0gW1xyXG4gICAgJy9zaG9wJyxcclxuICAgICcvYWJvdXQnLFxyXG4gICAgJy9jb250YWN0JyxcclxuICAgICcvc3VwcG9ydCcsXHJcbiAgICAnL2ZhcXMnLFxyXG4gICAgJy9zaGlwcGluZy1yZXR1cm5zJyxcclxuICAgICcvcHJpdmFjeS1wb2xpY3knLFxyXG4gICAgJy90ZXJtcy1vZi1zZXJ2aWNlJyxcclxuICAgICcvc2hpcHBpbmctcG9saWN5JyxcclxuICAgICcvcmV0dXJucy1wb2xpY3knLFxyXG4gICAgJy9mYXEnXHJcbiAgXTtcclxuXHJcbiAgLy8gUHJlLXNlZWQgc3RhdGljIHByb2R1Y3RzIGFuZCBjYXRlZ29yaWVzIHRvIGd1YXJhbnRlZSB0aGVpciBwcmVzZW5jZSBpbiB0aGUgc2l0ZW1hcFxyXG4gIGNvbnN0IHN0YXRpY1Byb2R1Y3RzID0gW1xyXG4gICAgJ2ZvbGxpY2xlLTgtaGFpci1ncm93dGgtc2VydW0nLFxyXG4gICAgJ2hhaXItZ3Jvd3RoLXNlcnVtLWJsYWNrLWVkaXRpb24nLFxyXG4gICAgJ2ZvbGxpY2xlLTgtc3ByYXktc2VydW0nXHJcbiAgXTtcclxuICBzdGF0aWNQcm9kdWN0cy5mb3JFYWNoKHNsdWcgPT4ge1xyXG4gICAgcm91dGVzLnB1c2goYC9wcm9kdWN0LyR7c2x1Z31gKTtcclxuICB9KTtcclxuICBcclxuICBjb25zdCBzdGF0aWNDYXRlZ29yaWVzID0gWydTZXJ1bXMnLCAnU3ByYXlzJ107XHJcbiAgc3RhdGljQ2F0ZWdvcmllcy5mb3JFYWNoKGNhdCA9PiB7XHJcbiAgICByb3V0ZXMucHVzaChgL3Nob3A/Y2F0ZWdvcnk9JHtlbmNvZGVVUklDb21wb25lbnQoY2F0KX1gKTtcclxuICB9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHN1cGFiYXNlVXJsID0gZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8ICdodHRwczovL2R0ZWhnYWpyZWVjYW9ucWFseGxmLnN1cGFiYXNlLmNvJztcclxuICAgIGNvbnN0IHN1cGFiYXNlS2V5ID0gZW52LlZJVEVfU1VQQUJBU0VfUFVCTElTSEFCTEVfS0VZIHx8ICdzYl9wdWJsaXNoYWJsZV9EQUZXTk4wUEI4Sk5OQklQM2M4Q0J3X2d5VlJpamVFJztcclxuXHJcbiAgICBpZiAoc3VwYWJhc2VVcmwgJiYgc3VwYWJhc2VLZXkpIHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtzdXBhYmFzZVVybH0vcmVzdC92MS9wcm9kdWN0cz9zZWxlY3Q9c2x1ZyxjYXRlZ29yeSxpc19hY3RpdmVfYXVzdHJhbGlhLGlzX2FjdGl2ZV9pbmRpYWAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnYXBpa2V5Jzogc3VwYWJhc2VLZXksXHJcbiAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtzdXBhYmFzZUtleX1gXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgY29uc3QgcHJvZHVjdHMgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvZHVjdHMpICYmIHByb2R1Y3RzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIC8vIEluY2x1ZGUgcHJvZHVjdHMgdGhhdCBhcmUgYWN0aXZlIGluIGVpdGhlciBBdXN0cmFsaWEgb3IgSW5kaWEgKGRlZmF1bHQgdG8gdHJ1ZSBpZiBub3QgZGVmaW5lZClcclxuICAgICAgICAgIGNvbnN0IGFjdGl2ZVByb2R1Y3RzID0gcHJvZHVjdHMuZmlsdGVyKChwOiBhbnkpID0+IChwLmlzX2FjdGl2ZV9hdXN0cmFsaWEgPz8gdHJ1ZSkgfHwgKHAuaXNfYWN0aXZlX2luZGlhID8/IHRydWUpKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgYWN0aXZlUHJvZHVjdHMuZm9yRWFjaCgocDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChwLnNsdWcpIHtcclxuICAgICAgICAgICAgICByb3V0ZXMucHVzaChgL3Byb2R1Y3QvJHtwLnNsdWd9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBjb25zdCBjYXRlZ29yaWVzID0gWy4uLm5ldyBTZXQoYWN0aXZlUHJvZHVjdHMubWFwKChwOiBhbnkpID0+IHAuY2F0ZWdvcnkpLmZpbHRlcihCb29sZWFuKSldO1xyXG4gICAgICAgICAgY2F0ZWdvcmllcy5mb3JFYWNoKChjYXQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICByb3V0ZXMucHVzaChgL3Nob3A/Y2F0ZWdvcnk9JHtlbmNvZGVVUklDb21wb25lbnQoY2F0KX1gKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ0NvdWxkIG5vdCBmZXRjaCBwcm9kdWN0cyBmcm9tIFN1cGFiYXNlIGR1cmluZyBidWlsZDonLCBlcnJvcik7XHJcbiAgfVxyXG5cclxuICAvLyBEZWR1cGxpY2F0ZSBhcnJheVxyXG4gIHJldHVybiBbLi4ubmV3IFNldChyb3V0ZXMpXTtcclxufVxyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKGFzeW5jICh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xyXG4gIGNvbnN0IGR5bmFtaWNSb3V0ZXMgPSBhd2FpdCBnZXREeW5hbWljUm91dGVzKGVudik7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgaG9zdDogXCI6OlwiLFxyXG4gICAgICBwb3J0OiA4MDgwLFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgICBzaXRlbWFwKHtcclxuICAgICAgICBob3N0bmFtZTogJ2h0dHBzOi8vc2NhbHZlYS5jb20nLFxyXG4gICAgICAgIGR5bmFtaWNSb3V0ZXMsXHJcbiAgICAgICAgZXhjbHVkZTogWycvYWRtaW4nLCAnL2FjY291bnQnLCAnL2NoZWNrb3V0JywgJy9jYXJ0JywgJy93aXNobGlzdCcsICcvYXV0aCddXHJcbiAgICAgIH0pXHJcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd08sU0FBUyxjQUFjLGVBQWU7QUFDOVEsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxPQUFPLGFBQWE7QUFKcEIsSUFBTSxtQ0FBbUM7QUFPekMsZUFBZSxpQkFBaUIsS0FBNkI7QUFDM0QsUUFBTSxTQUFTO0FBQUEsSUFDYjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBR0EsUUFBTSxpQkFBaUI7QUFBQSxJQUNyQjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUNBLGlCQUFlLFFBQVEsVUFBUTtBQUM3QixXQUFPLEtBQUssWUFBWSxJQUFJLEVBQUU7QUFBQSxFQUNoQyxDQUFDO0FBRUQsUUFBTSxtQkFBbUIsQ0FBQyxVQUFVLFFBQVE7QUFDNUMsbUJBQWlCLFFBQVEsU0FBTztBQUM5QixXQUFPLEtBQUssa0JBQWtCLG1CQUFtQixHQUFHLENBQUMsRUFBRTtBQUFBLEVBQ3pELENBQUM7QUFFRCxNQUFJO0FBQ0YsVUFBTSxjQUFjLElBQUkscUJBQXFCO0FBQzdDLFVBQU0sY0FBYyxJQUFJLGlDQUFpQztBQUV6RCxRQUFJLGVBQWUsYUFBYTtBQUM5QixZQUFNLFdBQVcsTUFBTSxNQUFNLEdBQUcsV0FBVyw4RUFBOEU7QUFBQSxRQUN2SCxTQUFTO0FBQUEsVUFDUCxVQUFVO0FBQUEsVUFDVixpQkFBaUIsVUFBVSxXQUFXO0FBQUEsUUFDeEM7QUFBQSxNQUNGLENBQUM7QUFDRCxVQUFJLFNBQVMsSUFBSTtBQUNmLGNBQU0sV0FBVyxNQUFNLFNBQVMsS0FBSztBQUNyQyxZQUFJLE1BQU0sUUFBUSxRQUFRLEtBQUssU0FBUyxTQUFTLEdBQUc7QUFFbEQsZ0JBQU0saUJBQWlCLFNBQVMsT0FBTyxDQUFDLE9BQVksRUFBRSx1QkFBdUIsVUFBVSxFQUFFLG1CQUFtQixLQUFLO0FBRWpILHlCQUFlLFFBQVEsQ0FBQyxNQUFXO0FBQ2pDLGdCQUFJLEVBQUUsTUFBTTtBQUNWLHFCQUFPLEtBQUssWUFBWSxFQUFFLElBQUksRUFBRTtBQUFBLFlBQ2xDO0FBQUEsVUFDRixDQUFDO0FBRUQsZ0JBQU0sYUFBYSxDQUFDLEdBQUcsSUFBSSxJQUFJLGVBQWUsSUFBSSxDQUFDLE1BQVcsRUFBRSxRQUFRLEVBQUUsT0FBTyxPQUFPLENBQUMsQ0FBQztBQUMxRixxQkFBVyxRQUFRLENBQUMsUUFBYTtBQUMvQixtQkFBTyxLQUFLLGtCQUFrQixtQkFBbUIsR0FBRyxDQUFDLEVBQUU7QUFBQSxVQUN6RCxDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixTQUFTLE9BQU87QUFDZCxZQUFRLEtBQUssd0RBQXdELEtBQUs7QUFBQSxFQUM1RTtBQUdBLFNBQU8sQ0FBQyxHQUFHLElBQUksSUFBSSxNQUFNLENBQUM7QUFDNUI7QUFHQSxJQUFPLHNCQUFRLGFBQWEsT0FBTyxFQUFFLEtBQUssTUFBTTtBQUM5QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFDM0MsUUFBTSxnQkFBZ0IsTUFBTSxpQkFBaUIsR0FBRztBQUVoRCxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsTUFDMUMsUUFBUTtBQUFBLFFBQ04sVUFBVTtBQUFBLFFBQ1Y7QUFBQSxRQUNBLFNBQVMsQ0FBQyxVQUFVLFlBQVksYUFBYSxTQUFTLGFBQWEsT0FBTztBQUFBLE1BQzVFLENBQUM7QUFBQSxJQUNILEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDaEIsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
