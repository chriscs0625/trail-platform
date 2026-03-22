import fs from "fs";
import path from "path";
const configPath = "c:/Users/chris/OneDrive/Documents/trail-platform/my-app/packages/api/vitest.config.ts";

const content = `import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    alias: {
      "date-fns": path.resolve(__dirname, "../../node_modules/date-fns/index.js"),
    },
  },
});
`;

fs.writeFileSync(configPath, content);
