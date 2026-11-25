import type { PublicComparison, PublicOption } from "@evolvaer/contracts";
import { sampleComparisons } from "./demo-comparison";

function publicOption(option: PublicOption): PublicOption {
  const sourceUrl = option.sourceUrl && /^https?:\/\//i.test(option.sourceUrl)
    ? option.sourceUrl
    : undefined;
  const gallery = option.gallery?.filter((photo) => photo.url.startsWith("/demo/"))
    .map((photo) => ({ url: photo.url, alt: photo.alt, caption: photo.caption }));

  return {
    side: option.side,
    displayName: option.displayName,
    area: option.area,
    rent: option.rent && {
      amount: option.rent.amount,
      currency: option.rent.currency,
      period: option.rent.period,
    },
    bills: option.bills,
    roomType: option.roomType,
    contractWeeks: option.contractWeeks,
    sourceUrl,
    gallery,
  };
}

export function getPublicComparison(publicId: string): PublicComparison | null {
  const comparison = sampleComparisons.find((item) => item.publicId === publicId);
  if (!comparison) return null;

  return {
    publicId: comparison.publicId,
    title: comparison.title,
    options: [
      { ...publicOption(comparison.options[0]), side: "A" },
      { ...publicOption(comparison.options[1]), side: "B" },
    ],
  };
}
