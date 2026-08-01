import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite"; // Giữ nguyên theo code của bạn
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa"; // IMPORT PLUGIN PWA VÀO ĐÂY

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // THÊM CẤU HÌNH PWA VÀO ĐÂY
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],

      // 1. CẤU HÌNH MANIFEST
      manifest: {
        name: "Study Planner App",
        short_name: "StudyPlanner",
        description: "Manage your classes, tasks, and study schedule.",
        theme_color: "#4A90E2",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      // 2. CẤU HÌNH SERVICE WORKER (Lưu Cache API)
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    } as any),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // File types to support raw imports...
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
