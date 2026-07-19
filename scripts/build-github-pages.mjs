import { cp, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const clientDir = resolve(root, "dist/client");
const outputDir = resolve(root, "site");

await mkdir(outputDir, { recursive: true });
await cp(clientDir, outputDir, { recursive: true, force: true });

const { default: worker } = await import(`${pathToFileURL(resolve(root, "dist/server/index.js")).href}?github-pages=${Date.now()}`);
const response = await worker.fetch(new Request("https://chika-hyakkei.github.io/", { headers: { accept: "text/html" } }), {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
}, { waitUntil() {}, passThroughOnException() {} });

if (!response.ok) throw new Error(`Static export failed: ${response.status}`);
const html = await response.text();
if (!html.includes("地下百景")) throw new Error("Static export did not contain the game page");

await writeFile(resolve(outputDir, "index.html"), html);
await writeFile(resolve(outputDir, ".nojekyll"), "");
console.log("GitHub Pages files written to site/");
