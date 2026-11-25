import { extractListing } from "../../../lib/server/extract-listing";
import { fetchListingHtml } from "../../../lib/server/safe-listing-fetch";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 2_000) {
    return Response.json({ error: "The listing link is too long." }, { status: 400 });
  }

  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return Response.json({ error: "Enter a listing link." }, { status: 400 });
  }
  if (!input || typeof input !== "object" || !("url" in input) || typeof input.url !== "string") {
    return Response.json({ error: "Enter a listing link." }, { status: 400 });
  }

  try {
    const { html, sourceUrl } = await fetchListingHtml(input.url);
    const fields = extractListing(html, sourceUrl);
    return Response.json({ sourceUrl, fields }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "The listing could not be previewed.",
    }, { status: 422, headers: { "Cache-Control": "no-store" } });
  }
}
