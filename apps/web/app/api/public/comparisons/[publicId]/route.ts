import { getPublicComparison } from "../../../../../lib/public-comparisons";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;
  const comparison = getPublicComparison(publicId);
  if (!comparison) {
    return Response.json({ error: "Comparison unavailable" }, { status: 404 });
  }

  return Response.json(comparison, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
