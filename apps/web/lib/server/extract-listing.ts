import { load } from "cheerio";

type ExtractedListing = {
  name?: string;
  area?: string;
  weeklyRent?: number;
  deposit?: number;
  bills?: "included" | "excluded" | "partial";
  internet?: "included" | "available" | "unavailable";
  roomType?: string;
  contractWeeks?: number;
  images?: string[];
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

export function extractListing(html: string, sourceUrl?: string): ExtractedListing {
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
  const imageCandidates: unknown[] = [
    ...$('meta[property="og:image"], meta[name="twitter:image"]').map((_index, element) => $(element).attr("content")).get(),
    listing?.image,
  ];
  const images = imageCandidates.flatMap((candidate): string[] => {
    const entries = Array.isArray(candidate) ? candidate : [candidate];
    return entries.flatMap((entry) => {
      const value = typeof entry === "string" ? entry : object(entry)?.url;
      if (typeof value !== "string" || value.length > 2_000) return [];
      try {
        const url = new URL(value, sourceUrl);
        return ["http:", "https:"].includes(url.protocol) ? [url.href] : [];
      } catch {
        return [];
      }
    });
  });
  const address = object(listing?.address);
  const locality = address?.addressLocality;
  const offers = object(listing?.offers) ?? object(Array.isArray(listing?.offers) ? listing.offers[0] : null);
  const priceSpecification = object(offers?.priceSpecification);
  const price = priceSpecification?.price ?? offers?.price;
  const pricePeriod = String(priceSpecification?.unitText ?? offers?.unitText ?? "").toLowerCase();
  const priceCurrency = String(priceSpecification?.priceCurrency ?? offers?.priceCurrency ?? "").toUpperCase();
  const parsedStructuredRent = typeof price === "number" || typeof price === "string" ? Number(price) : NaN;
  const structuredRent = pricePeriod.includes("week") && (!priceCurrency || priceCurrency === "GBP") &&
    Number.isFinite(parsedStructuredRent) && parsedStructuredRent >= 20 && parsedStructuredRent <= 5_000
    ? parsedStructuredRent : undefined;
  const descriptionText = [description, typeof listing?.description === "string" ? listing.description : ""].join(" ");
  const contractMatch = descriptionText.match(/\b(\d{2})[- ]week(?:s)?\s+contract\b|\bcontract\s+(?:length\s*)?[:\-]?\s*(\d{2})\s+weeks\b/i);
  const contractWeeks = contractMatch ? Number(contractMatch[1] ?? contractMatch[2]) : undefined;
  const roomType = /\bstudio\b/i.test(descriptionText)
    ? "Studio"
    : /\b(?:en-suite|ensuite)\b/i.test(descriptionText) ? "En-suite room" : undefined;
  const bills = /\b(?:bills|utilities)\s+(?:not\s+included|excluded)\b/i.test(descriptionText)
    ? "excluded"
    : /\b(?:all\s+)?(?:bills|utilities)\s+included\b/i.test(descriptionText) ? "included" : undefined;
  const depositMatches = [
    ...descriptionText.matchAll(/(?<!holding\s)\b(?:tenancy\s+)?deposit\s*(?:of|:)\s*£\s*(\d{2,5}(?:\.\d{1,2})?)\b/gi),
    ...descriptionText.matchAll(/£\s*(\d{2,5}(?:\.\d{1,2})?)\s+(?:tenancy\s+)?deposit\b/gi),
  ].map((match) => Number(match[1]));
  const deposits = [...new Set(depositMatches)];
  const deposit = deposits.length === 1 ? deposits[0] : undefined;
  const internet = /\b(?:wi-?fi|internet)\s+included\b/i.test(descriptionText)
    ? "included"
    : /\b(?:wi-?fi|internet)\s+available\s+(?:for|at)\s+(?:an?\s+)?(?:extra|additional)\s+(?:cost|fee)\b/i.test(descriptionText)
      ? "available" : undefined;

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
    deposit,
    internet,
    roomType,
    contractWeeks,
    images: [...new Set(images)].slice(0, 8),
  };
}
