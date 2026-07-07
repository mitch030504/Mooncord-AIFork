import js from "@eslint/js";
import globals from "globals";

// ESLint is scoped to JS config/build files in this repo.
// TypeScript source is type-checked via `npm run typecheck` (tsc --noEmit).
export default [
  js.configs.recommended,
  {
    files: ["*.js", "*.mjs", "*.cjs", "scripts/**"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-console": "off",
      "no-process-exit": "off"
    }
  },
  {
    ignores: ["dist/**", "node_modules/**", "assets/**", "images-workspaces/**", "locales/**", "src/**"]
  }
];