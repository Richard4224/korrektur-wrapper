import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { proofreadApiPlugin } from "./server/vitePlugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), proofreadApiPlugin(env)],
    test: {
      environment: "jsdom",
    },
  };
});
