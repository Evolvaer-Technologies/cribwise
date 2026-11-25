export type PublicOption = {
  side: "A" | "B";
  displayName: string;
  area?: string;
  rent?: { amount: number; currency: string; period: "week" | "month" };
  bills?: "included" | "excluded" | "partial";
  roomType?: string;
  contractWeeks?: number;
  sourceUrl?: string;
  heroImage?: { url: string; alt: string };
  gallery?: Array<{ url: string; alt: string; caption?: string }>;
};

export type PublicComparison = {
  publicId: string;
  title: string;
  options: [PublicOption & { side: "A" }, PublicOption & { side: "B" }];
};
