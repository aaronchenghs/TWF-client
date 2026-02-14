import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function getGitShortHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "nogit";
  }
}

function getDirtySuffix(): string {
  try {
    const status = execSync("git status --porcelain", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return status ? "-dirty" : "";
  } catch {
    return "";
  }
}

const packageJsonPath = new URL("./package.json", import.meta.url);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  version?: string;
};
const packageVersion = packageJson.version ?? "0.0.0";
const versionWithBuildMeta = `${packageVersion}+${getGitShortHash()}${getDirtySuffix()}`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(versionWithBuildMeta),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
