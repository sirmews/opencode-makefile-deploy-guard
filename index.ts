import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";

// Regex to catch raw deploy commands
const DEPLOY_REGEX = /^(npx\s+)?\b(wrangler deploy|bun run deploy(:worker|:auth|:frontend)?|npm run deploy)\b/;

export const MakefileDeployGuard: Plugin = async ({ client, directory }) => {
  // 1. Check if a Makefile actually exists in the project root DURING initialization
  const hasMakefile = fs.existsSync(path.join(directory, "Makefile")) || 
                      fs.existsSync(path.join(directory, "makefile"));

  // 2. If no Makefile exists, we skip registering the hooks entirely.
  // This means the plugin is effectively disabled for this project
  // and direct deployments will be allowed.
  if (!hasMakefile) {
    if (client?.app?.log) {
      await client.app.log({
        body: {
          service: "makefile-deploy-guard",
          level: "info",
          message: "No Makefile found. Plugin is bypassing and allowing direct deploys."
        }
      });
    }
    // Returning an empty object means no event listeners are hooked up
    return {};
  }

  // 3. Makefile exists, so we register the execution hook to enforce its usage
  return {
    "tool.execute.before": async (input, output) => {
      // Only care about bash/shell commands
      if (input.tool !== "bash" && input.tool !== "shell") return;

      const cmd = output.args?.command as string | undefined;
      if (!cmd) return;

      const normalized = cmd.replace(/\s+/g, " ").trim();

      // If it matches a raw deploy command
      if (DEPLOY_REGEX.test(normalized)) {
        if (client?.app?.log) {
          await client.app.log({
            body: {
              service: "makefile-deploy-guard",
              level: "info",
              message: "Blocked direct deploy command",
              extra: { command: cmd }
            }
          });
        }

        throw new Error(
          [
            "🚫 Direct deploy blocked by MakefileDeployGuard.",
            "",
            "This project must use the Makefile so env + secrets are wired correctly.",
            "Instead of:",
            `  ${cmd}`,
            "",
            "Use the Makefile. For example:",
            "  make deploy          # full deploy",
            "  make deploy-worker   # just the API worker",
            "",
            "Run 'make help' or look at the Makefile for all available deployment targets."
          ].join("\n")
        );
      }
    }
  };
};

export default MakefileDeployGuard;
