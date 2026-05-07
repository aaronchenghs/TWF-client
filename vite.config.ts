import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const packageJsonPath = new URL("./package.json", import.meta.url);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  version?: string;
};
const packageVersion = packageJson.version ?? "0.0.0";

function resolveHelloJoinSoundUrls(): string[] {
  const dir = fileURLToPath(
    new URL("./public/sounds/hello", import.meta.url),
  );

  try {
    return readdirSync(dir)
      .filter((name) => name.toLowerCase().endsWith(".mp3"))
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
      )
      .map((name) => `/sounds/hello/${name}`);
  } catch {
    return [];
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react-router")) return "router";

          if (
            id.includes("framer-motion") ||
            id.includes("motion-dom") ||
            id.includes("motion-utils")
          ) {
            return "motion";
          }

          if (
            id.includes("@reduxjs/toolkit") ||
            id.includes("react-redux") ||
            id.includes("/redux/") ||
            id.includes("/immer/")
          ) {
            return "state";
          }

          if (
            id.includes("socket.io-client") ||
            id.includes("engine.io-client") ||
            id.includes("socket.io-parser") ||
            id.includes("engine.io-parser") ||
            id.includes("@socket.io/component-emitter")
          ) {
            return "socket";
          }
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion),
    __HELLO_JOIN_SOUND_URLS__: JSON.stringify(resolveHelloJoinSoundUrls()),
  },
  server: {
    // Lets phones hit the Vite origin while Vite proxies Socket.IO to the local backend.
    proxy: {
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
