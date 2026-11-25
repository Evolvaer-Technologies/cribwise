import type { PublicComparison } from "@evolvaer/contracts";

export const demoComparison: PublicComparison = {
  publicId: "demo",
  title: "Which student home would you choose?",
  options: [
    {
      side: "A",
      displayName: "Juniper House",
      area: "Hulme, Manchester",
      rent: { amount: 175, currency: "GBP", period: "week" },
      bills: "included",
      roomType: "En-suite room",
      contractWeeks: 44,
    },
    {
      side: "B",
      displayName: "Alder Court",
      area: "Rusholme, Manchester",
      rent: { amount: 155, currency: "GBP", period: "week" },
      roomType: "Private room, shared bathroom",
      contractWeeks: 48,
    },
  ],
};

export const sampleComparisons: PublicComparison[] = [
  demoComparison,
  {
    publicId: "city-or-campus",
    title: "City centre or campus?",
    options: [
      { side: "A", displayName: "Canal View", area: "Manchester city centre", rent: { amount: 190, currency: "GBP", period: "week" }, roomType: "Studio" },
      { side: "B", displayName: "Campus Mews", area: "Fallowfield, Manchester", rent: { amount: 160, currency: "GBP", period: "week" }, bills: "included", roomType: "En-suite room" },
    ],
  },
  {
    publicId: "room-or-studio",
    title: "Shared room or private studio?",
    options: [
      { side: "A", displayName: "Willow Rooms", area: "Salford, Greater Manchester", rent: { amount: 145, currency: "GBP", period: "week" }, roomType: "Private room, shared kitchen" },
      { side: "B", displayName: "Quay Studios", area: "Salford, Greater Manchester", rent: { amount: 205, currency: "GBP", period: "week" }, roomType: "Studio" },
    ],
  },
];
