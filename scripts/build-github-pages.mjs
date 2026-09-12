import { cp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const clientDir = resolve(root, "dist/client");
const outputDir = resolve(root, "site");

await rm(outputDir, { recursive: true, force: true });
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
await mkdir(resolve(outputDir, "en"), { recursive: true });
await writeFile(resolve(outputDir, "en", "index.html"), html);
await writeFile(resolve(outputDir, ".nojekyll"), "");
async function assetPaths(directory, prefix="") {
  const entries=await readdir(directory,{withFileTypes:true}),files=[];
  for(const entry of entries){
    const relative=prefix+entry.name;
    if(entry.isDirectory())files.push(...await assetPaths(resolve(directory,entry.name),relative+"/"));
    else if(/\.(js|css|png|jpe?g|webp|svg|woff2?|webmanifest)$/.test(entry.name)&&!["sw.js","ranking-config.js"].includes(relative))files.push("/"+relative);
  }
  return files;
}
const urls=["/","/en/",...await assetPaths(outputDir)].sort();
const hash=createHash("sha256");
for(const url of urls)hash.update(url).update(await readFile(resolve(outputDir,url==="/en/"?"en/index.html":url==="/"?"index.html":url.slice(1))));
const version="chika-hyakkei-shell-"+hash.digest("hex").slice(0,16);
const sw=await readFile(resolve(root,"public/sw.js"),"utf8");
await writeFile(resolve(outputDir,"sw.js"),sw.replace(/const CACHE_VERSION = .*?;/,"const CACHE_VERSION = "+JSON.stringify(version)+";").replace(/const CORE_URLS = .*?;/,"const CORE_URLS = "+JSON.stringify(urls)+";"));
console.log("GitHub Pages files written to site/; precached "+urls.length+" shell assets ("+version+")");
