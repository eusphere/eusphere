import path from "node:path";
import { fileURLToPath } from "node:url";
import sirv from "sirv";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [
    {
      name: "serve-static-folder",
      configureServer(server) {
        server.middlewares.use(
          "/static",
          sirv(path.join(root, "static"), { dev: true, single: false })
        );
      },
    },
  ],
  resolve: {
    alias:
      command === "serve"
        ? {
            "/static/index.js": path.resolve(root, "src/main.ts"),
          }
        : {},
  },
  build: {
    outDir: path.join(root, "static"),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(root, "src/main.ts"),
      output: {
        entryFileNames: "index.js",
        format: "es",
      },
    },
  },
}));
