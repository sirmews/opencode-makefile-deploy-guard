# OpenCode Makefile Deploy Guard

A project-local [OpenCode](https://opencode.ai/) plugin designed to enforce strict deployment guardrails. It intercepts deployment commands (`wrangler deploy`, `bun run deploy`, `npm run deploy`, etc.) run by the OpenCode AI agent (or the user directly through the agent) and blocks them, forcing the use of predefined `Makefile` targets.

This ensures critical environment variables, secrets, and "preflight" scripts are properly executed instead of an agent mistakenly attempting a raw deployment.

---

## Why?

When working with AI coding assistants, they might attempt to "helpfully" deploy code directly if asked. For example, they might automatically run:

```bash
wrangler deploy
```

However, this bypasses essential environment setups and safety checks. This plugin intercepts the `bash` or `shell` tool execution *before* it runs, logs the attempt, and returns a hard error instructing the agent to use `make deploy` instead.

### Why Markdown (AGENTS.md)?
While this plugin acts as a "hard" guardrail that strictly blocks bad commands, it is best paired with a "soft" guardrail: documentation. 

You should document these deployment rules in your project's `AGENTS.md` (or similar markdown guidelines). Why?
1. **Saves Time/Tokens**: By documenting that raw deployments are forbidden, the agent won't even *try* to run them, saving API calls and round-trips.
2. **Contextual Learning**: The markdown file teaches the agent *why* it should use `make deploy`, whereas the plugin just acts as the final safety net in case it hallucinates or ignores the prompt.

---

## Features

- **Context-Aware ("Soft Guard")**: The plugin checks if your project actually uses a `Makefile` before activating. If no `Makefile` is found in the project root, it silently disables itself, allowing direct deploys to pass through.
- **Intercepts Raw Commands**: Watches for `wrangler deploy`, `bun run deploy`, `npm run deploy`, etc.
- **Blocks Execution**: Throws a clear error message teaching the LLM the correct project conventions.
- **Enforces Safety**: Ensures deployments are routed through your single source of truth (`Makefile`).

---

## Usage

1. Place this plugin in your project's `.opencode/plugins/` folder, or in `tools/makefile-deploy-guard` and register it in your `opencode.json`.
2. Configure `opencode.json` at your repository root to point to the file:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["./tools/makefile-deploy-guard/index.ts"]
}
```

3. Set up your `Makefile` to handle the actual deployments and run any prerequisite checks.

---

## Development

Modify the `DEPLOY_REGEX` or the error message inside `index.ts` to customize the blocked commands and the instructions given to the agent.
