import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootPath = fileURLToPath(new URL("../", import.meta.url));
const publicPath = path.join(rootPath, "public");
const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = resolvePublicPath(pathname);

  if (!filePath.startsWith(publicPath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": contentType(filePath) });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

try {
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const homeResponse = await fetch(`${baseUrl}/`);
  const cssResponse = await fetch(`${baseUrl}/styles.css`);

  if (!homeResponse.ok) throw new Error(`Homepage returned ${homeResponse.status}`);
  if (!cssResponse.ok) throw new Error(`Stylesheet returned ${cssResponse.status}`);

  const html = await homeResponse.text();
  const css = await cssResponse.text();
  const headers = await readFile(path.join(publicPath, "_headers"), "utf8");

  if (!html.includes("<h1>Emergency plumbing in Brisbane</h1>")) throw new Error("Homepage hero did not render");
  if (!html.includes('href="tel:+61755550100')) throw new Error("Click-to-call CTA missing");
  if (!html.includes("utm_campaign=emergency_plumbing_brisbane")) throw new Error("UTM CTA example missing");
  if (!html.includes('"@type": "LocalBusiness"')) throw new Error("LocalBusiness JSON-LD missing");
  if (!html.includes("https://a1local.com.au/extensions/")) throw new Error("A1 Local/AdPages attribution link missing");
  if (!css.includes("--accent")) throw new Error("Stylesheet did not load expected CSS");
  if (!headers.includes("Content-Security-Policy")) throw new Error("_headers missing CSP");
  if (/<a\b[^>]+href=["']tel:[^"']+\?/.test(html)) throw new Error("tel: CTAs must not include query parameters");

  const localLinks = findLocalLinks(html);
  for (const href of localLinks) {
    const response = await fetch(`${baseUrl}${href}`);
    if (!response.ok) throw new Error(`Local link returned ${response.status}: ${href}`);
  }

  console.log("cloudflare pages local service starter smoke ok");
} finally {
  await new Promise((resolve) => server.close(resolve));
}

function resolvePublicPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const candidate = path.join(publicPath, decoded);
  if (decoded.endsWith("/")) return path.join(candidate, "index.html");
  if (path.extname(candidate)) return candidate;
  return path.join(candidate, "index.html");
}

function findLocalLinks(html) {
  const links = new Set();
  const pattern = /<a\b[^>]+href=["']([^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const href = match[1];
    if (href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:") || /^https?:\/\//i.test(href)) continue;
    const url = new URL(href, "http://127.0.0.1");
    if (url.pathname === "/" || url.pathname === "/styles.css") continue;
    links.add(url.pathname);
  }
  return [...links];
}

function contentType(filePath) {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "text/plain; charset=utf-8";
}
