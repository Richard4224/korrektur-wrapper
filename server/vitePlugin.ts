import type { Connect, Plugin } from "vite";
import { handleProofread } from "./handleProofread";

export function proofreadApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: "proofread-api",
    configureServer(server) {
      server.middlewares.use(
        "/api/pruefen",
        (req: Connect.IncomingMessage, res, next) => {
          if (req.method !== "POST") {
            next();
            return;
          }
          void handleProofread(req, res, env);
        },
      );
    },
  };
}
