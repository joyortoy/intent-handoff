type Env = { ASSETS: { fetch(request: Request): Promise<Response> } };

const MAX_HTML_BYTES = 800_000;

function isPublicHttpsUrl(value: unknown): URL | null {
  try {
    const url = new URL(String(value ?? ""));
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !hostname) return null;
    if (
      hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") ||
      hostname.endsWith(".internal") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":")
    ) return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchPublicPage(initialUrl: URL): Promise<Response> {
  let currentUrl = initialUrl;
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const response = await fetch(currentUrl, {
      headers: { "user-agent": "WebMCP-Handoff/1.0 (+https://intent-handoff.joyhuiqi.workers.dev)" },
      redirect: "manual",
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    const nextUrl = location ? isPublicHttpsUrl(new URL(location, currentUrl).href) : null;
    if (!nextUrl) throw new Error("Target redirected to a disallowed URL");
    currentUrl = nextUrl;
  }
  throw new Error("Target redirected too many times");
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = { amp: "&", apos: "'", gt: ">", hellip: "…", lt: "<", nbsp: " ", quot: '"' };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return named[code.toLowerCase()] ?? entity;
  });
}

function htmlToText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeEntities((titleMatch?.[1] ?? "").replace(/<[^>]+>/g, "").trim());
  const text = decodeEntities(html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|svg|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|section|article|main|header|footer|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 12_000);
  return { title, text };
}

async function snapshot(request: Request): Promise<Response> {
  let body: { url?: unknown };
  try { body = (await request.json()) as { url?: unknown }; }
  catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const target = isPublicHttpsUrl(body.url);
  if (!target) return Response.json({ error: "Use a public https URL" }, { status: 400 });
  try {
    const response = await fetchPublicPage(target);
    if (!response.ok) return Response.json({ error: `Target returned ${response.status}` }, { status: 502 });
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return Response.json({ error: "Target is not an HTML or text page" }, { status: 415 });
    }
    if (Number(response.headers.get("content-length") ?? 0) > MAX_HTML_BYTES) {
      return Response.json({ error: "Target page is too large" }, { status: 413 });
    }
    const raw = (await response.text()).slice(0, MAX_HTML_BYTES);
    const extracted = contentType.includes("text/html") ? htmlToText(raw) : { title: target.hostname, text: raw.slice(0, 12_000) };
    return Response.json({ url: response.url || target.href, title: extracted.title || target.hostname, text: extracted.text });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Fetch failed" }, { status: 502 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/snapshot" && request.method === "POST") return snapshot(request);
    if (url.pathname.startsWith("/api/")) return Response.json({ error: "Not found" }, { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
