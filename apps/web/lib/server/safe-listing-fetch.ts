import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import ipaddr from "ipaddr.js";

const maxHtmlBytes = 1_000_000;
const maxRedirects = 3;

function isPublicAddress(address: string): boolean {
  const parsed = ipaddr.parse(address);
  if (parsed.range() !== "unicast") return false;
  if (parsed.kind() === "ipv4" && parsed.match(ipaddr.parseCIDR("198.18.0.0/15"))) return false;
  return true;
}

function parseListingUrl(input: string): URL {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Use a public http or https listing link.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new Error("Listing links must use standard web ports.");
  }
  if (!url.hostname.includes(".") || ipaddr.isValid(url.hostname) ||
    /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname)) {
    throw new Error("Use a public listing website.");
  }
  url.hash = "";
  return url;
}

async function fetchOne(url: URL): Promise<{ html?: string; redirect?: string }> {
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("This listing website is unavailable.");
  }
  const pinned = addresses[0];
  const send = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const request = send(url, {
      method: "GET",
      agent: false,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Encoding": "identity",
        "User-Agent": "CribwiseListingPreview/1.0",
      },
      lookup: (_hostname, options, callback) => {
        if (options.all) callback(null, [pinned]);
        else callback(null, pinned.address, pinned.family);
      },
    }, (response) => {
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        resolve({ redirect: response.headers.location });
        return;
      }
      if (status !== 200) {
        response.resume();
        reject(new Error("The listing website did not provide a readable page."));
        return;
      }
      const contentType = String(response.headers["content-type"] ?? "");
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        response.resume();
        reject(new Error("This link does not point to a listing webpage."));
        return;
      }
      const declaredSize = Number(response.headers["content-length"] ?? 0);
      if (declaredSize > maxHtmlBytes) {
        response.destroy();
        reject(new Error("The listing page is too large to preview."));
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxHtmlBytes) {
          response.destroy(new Error("The listing page is too large to preview."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ html: Buffer.concat(chunks).toString("utf8") }));
      response.on("error", reject);
    });
    request.setTimeout(8_000, () => request.destroy(new Error("The listing website took too long to respond.")));
    request.on("error", reject);
    request.end();
  });
}

export async function fetchListingHtml(input: string): Promise<{ html: string; sourceUrl: string }> {
  let url = parseListingUrl(input);
  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const result = await fetchOne(url);
    if (result.html) return { html: result.html, sourceUrl: url.href };
    if (!result.redirect || redirects === maxRedirects) break;
    url = parseListingUrl(new URL(result.redirect, url).href);
  }
  throw new Error("The listing redirected too many times.");
}
