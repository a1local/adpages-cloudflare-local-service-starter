import { readdir, readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const requiredFiles = [
  "package.json",
  "LICENSE",
  "README.md",
  "PRIVACY.md",
  "PUBLISH_BLOCKERS.md",
  "data/business.json",
  "examples/launch-checklist.csv",
  "public/index.html",
  "public/styles.css",
  "public/_headers",
  "public/areas/brisbane-cbd/index.html",
  "public/areas/fortitude-valley/index.html",
  "public/areas/new-farm/index.html",
  "public/areas/hamilton/index.html",
  "scripts/check.mjs",
  "scripts/smoke.mjs"
];
const textFiles = new Map();
const errors = [];
const bannedPattern = /\b(?:fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|document\.cookie|localStorage|sessionStorage|gtag\(|dataLayer|googletagmanager|google-analytics|facebook\.net|hotjar|clarity|tracking pixel|hidden backlink)\b/i;
const remoteAssetPattern = /<(?:script|img|iframe|source|video|audio)\b[^>]+src=["']https?:\/\/|<link\b(?=[^>]+rel=["']stylesheet["'])[^>]+href=["']https?:\/\//i;

for (const file of requiredFiles) {
  try {
    const content = await readFile(new URL(file, root), "utf8");
    textFiles.set(file, content);
    if (!content.trim()) errors.push(`${file} must not be empty`);
  } catch {
    errors.push(`${file} is required`);
  }
}

const packageJson = parseJson("package.json");
if (packageJson) {
  if (packageJson.private !== true) errors.push("package.json must remain private until publishing details are final");
  if (packageJson.type !== "module") errors.push("package.json must use ESM scripts");
  if (packageJson.license !== "MIT") errors.push("package.json must declare MIT license for public template release");
  if (packageJson.homepage !== "https://a1local.com.au/extensions/") errors.push("package.json must include the A1 Local tools homepage");
  if (packageJson.repository?.url !== "https://github.com/a1local/adpages-cloudflare-local-service-starter.git") errors.push("package.json must include the public template repository URL");
  if (!packageJson.scripts?.check || !packageJson.scripts?.smoke) errors.push("package.json must define check and smoke scripts");
}

const business = parseJson("data/business.json");
if (business) {
  for (const field of ["name", "primaryService", "siteUrl", "phoneDisplay", "phoneHref", "email"]) {
    if (!business[field]) errors.push(`data/business.json missing ${field}`);
  }
  if (!Array.isArray(business.services) || business.services.length < 3) errors.push("data/business.json should include at least three services");
  if (!Array.isArray(business.serviceAreas) || business.serviceAreas.length < 3) errors.push("data/business.json should include at least three service areas");
}

const html = textFiles.get("public/index.html") || "";
if (html) {
  const schema = extractJsonLd(html);
  if (!schema) {
    errors.push("public/index.html must include valid LocalBusiness JSON-LD");
  } else {
    if (schema["@type"] !== "LocalBusiness") errors.push("JSON-LD @type must be LocalBusiness");
    if (business?.name && schema.name !== business.name) errors.push("JSON-LD name must match data/business.json");
    if (business?.phoneHref && schema.telephone !== business.phoneHref) errors.push("JSON-LD telephone must match data/business.json");
    if (!Array.isArray(schema.areaServed) || schema.areaServed.length < 3) errors.push("JSON-LD must include service areas");
    if (!Array.isArray(schema.makesOffer) || schema.makesOffer.length < 3) errors.push("JSON-LD must include service offers");
  }
  if (!html.includes('href="tel:')) errors.push("public/index.html must include a click-to-call CTA");
  if (!html.includes("utm_source=") || !html.includes("utm_medium=") || !html.includes("utm_campaign=")) errors.push("public/index.html must include visible UTM-safe CTA examples");
  if (!html.includes('href="./styles.css"')) errors.push("public/index.html should use the local stylesheet with a direct-preview-safe relative path");
  if (!html.includes("https://a1local.com.au/extensions/")) errors.push("public/index.html must include visible A1 Local/AdPages attribution link");
  if (remoteAssetPattern.test(html)) errors.push("public/index.html contains a remote asset reference");
}

const headers = textFiles.get("public/_headers") || "";
if (headers && (!headers.includes("Content-Security-Policy") || !headers.includes("connect-src 'none'"))) {
  errors.push("public/_headers should document a restrictive static CSP");
}

for (const file of ["README.md", "PRIVACY.md", "PUBLISH_BLOCKERS.md"]) {
  const content = textFiles.get(file) || "";
  for (const token of ["Cloudflare Pages", "analytics"]) {
    if (!content.includes(token)) errors.push(`${file} missing ${token}`);
  }
}

for (const token of ["output directory", "public", "custom domain", "SSL", "canonical", "_headers"]) {
  if (!(textFiles.get("README.md") || "").includes(token)) errors.push(`README.md missing Cloudflare Pages deploy blocker: ${token}`);
}

for (const token of ["does not", "cookies", "remote", "hidden backlinks"]) {
  if (!(textFiles.get("PRIVACY.md") || "").includes(token)) errors.push(`PRIVACY.md missing ${token}`);
}

const allFiles = await listFiles(root);
for (const file of allFiles) {
  if (!/\.(?:html|css|js|mjs|json|md|csv|txt|headers)$|_headers$/.test(file)) continue;
  const content = await readFile(new URL(file, root), "utf8");
  if (file !== "scripts/check.mjs" && bannedPattern.test(content)) errors.push(`${file} contains banned tracking or storage pattern`);
  if (/\.(?:js|mjs)$/.test(file) && remoteAssetPattern.test(content)) errors.push(`${file} contains a remote asset reference`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("cloudflare pages local service starter check ok");

function parseJson(file) {
  try {
    return JSON.parse(textFiles.get(file));
  } catch (error) {
    errors.push(`${file} is invalid JSON: ${error.message}`);
    return null;
  }
}

function extractJsonLd(html) {
  const match = html.match(/<script\s+type=["']application\/ld\+json["']>\s*([\s\S]*?)\s*<\/script>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    errors.push(`LocalBusiness JSON-LD is invalid JSON: ${error.message}`);
    return null;
  }
}

async function listFiles(directoryUrl, prefix = "") {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = `${prefix}${entry.name}`;
    const entryUrl = new URL(entry.name, directoryUrl);
    if (entry.isDirectory()) {
      files.push(...await listFiles(new URL(`${entry.name}/`, directoryUrl), `${relativePath}/`));
    } else if ((await stat(entryUrl)).isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}
