import { load } from "cheerio";

type ExtractedListing = {
  name?: string;
  area?: string;
  weeklyRent?: number;
  bills?: "included" | "excluded" | "partial";
  roomType?: string;
  contractWeeks?: number;
};

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nestedObjects(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(nestedObjects);
  const item = object(value);
  if (!item) return [];
  return [item, ...nestedObjects(item["@graph"])];
}

function weeklyPrice(text: string): number | undefined {
  const pattern = /£\s*(\d{2,4}(?:\.\d{1,2})?)\s*(?:\/\s*week|per\s+week|pw\b)/gi;
  const prices = [...text.matchAll(pattern)]
    .filter((match) => !/\bfrom\s*$/i.test(text.slice(Math.max(0, match.index - 20), match.index)))
    .map((match) => Number(match[1]));
  const unique = [...new Set(prices)];
  return unique.length === 1 ? unique[0] : undefined;
}

export function extractListing(html: string): ExtractedListing {
  const $ = load(html);
  const metadataTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const heading = $("h1").first().text().trim();
  const title = heading || metadataTitle || $("title").text().trim();
  const description = $('meta[property="og:description"]').attr("content") ??
    $('meta[name="description"]').attr("content") ?? "";

  const structured: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_index, element) => {
    try {
      structured.push(...nestedObjects(JSON.parse($(element).text())));
    } catch {
      // Ignore malformed structured data and use visible metadata.
    }
  });
  const listing = structured.find((item) =>
    ["Apartment", "Accommodation", "LodgingBusiness", "Residence", "Product"].includes(String(item["@type"]))) ??
    structured.find((item) => object(item.address) || item.offers);
  const address = object(listing?.address);
  const locality = address?.addressLocality;
  const offers = object(listing?.offers) ?? object(Array.isArray(listing?.offers) ? listing.offers[0] : null);
  const priceSpecification = object(offers?.priceSpecification);
  const price = priceSpecification?.price ?? offers?.price;
  const pricePeriod = String(priceSpecification?.unitText ?? offers?.unitText ?? "").toLowerCase();
  const structuredRent = pricePeriod.includes("week") && (typeof price === "number" || typeof price === "string")
    ? Number(price)
    : undefined;
  const descriptionText = [description, typeof listing?.description === "string" ? listing.description : ""].join(" ");
  const contractMatch = descriptionText.match(/\b(\d{2})[- ]week(?:s)?\s+contract\b|\bcontract\s+(?:length\s*)?[:\-]?\s*(\d{2})\s+weeks\b/i);
  const contractWeeks = contractMatch ? Number(contractMatch[1] ?? contractMatch[2]) : undefined;
  const roomType = /\bstudio\b/i.test(descriptionText)
    ? "Studio"
    : /\b(?:en-suite|ensuite)\b/i.test(descriptionText) ? "En-suite room" : undefined;
  const bills = /\b(?:bills|utilities)\s+(?:not\s+included|excluded)\b/i.test(descriptionText)
    ? "excluded"
    : /\b(?:all\s+)?(?:bills|utilities)\s+included\b/i.test(descriptionText) ? "included" : undefined;

  $("script, style, nav, header, footer").remove();
  const pageText = $("main, article, [role='main']").first().text() || $("body").text();
  const candidateRent = Number.isFinite(structuredRent)
    ? structuredRent
    : weeklyPrice(description) ?? weeklyPrice(pageText.slice(0, 100_000));
  const isStartingPrice = candidateRent !== undefined &&
    new RegExp(`\\bfrom\\s*£\\s*${candidateRent}(?!\\d)`, "i").test(`${description} ${pageText}`);

  return {
    name: (typeof listing?.name === "string" ? listing.name : title).slice(0, 100) || undefined,
    area: typeof locality === "string" ? locality.slice(0, 100) : undefined,
    weeklyRent: isStartingPrice ? undefined : candidateRent,
    bills,
    roomType,
    contractWeeks,
  };
}
