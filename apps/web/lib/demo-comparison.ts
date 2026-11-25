import type { PublicComparison } from "@evolvaer/contracts";
import { areas } from "./areas";

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
      gallery: [
        { url: "/demo/bedroom.png", alt: "Illustrative student bedroom with desk and window", caption: "Illustrative bedroom" },
        { url: "/demo/kitchen.png", alt: "Illustrative shared kitchen and dining area", caption: "Illustrative kitchen" },
      ],
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

const originalSamples: PublicComparison[] = [
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
  {
    publicId: "close-or-spacious",
    title: "Closer to campus or more space?",
    options: [
      { side: "A", displayName: "Elm Place", area: "Oxford Road, Manchester", rent: { amount: 185, currency: "GBP", period: "week" }, bills: "included", roomType: "En-suite room", contractWeeks: 44 },
      { side: "B", displayName: "Brook House", area: "Withington, Manchester", rent: { amount: 150, currency: "GBP", period: "week" }, roomType: "Large private room", contractWeeks: 48 },
    ],
  },
  {
    publicId: "bills-or-budget",
    title: "Bills included or lower rent?",
    options: [
      { side: "A", displayName: "Maple Court", area: "Hulme, Manchester", rent: { amount: 178, currency: "GBP", period: "week" }, bills: "included", roomType: "En-suite room", contractWeeks: 44 },
      { side: "B", displayName: "Park Lane Rooms", area: "Moss Side, Manchester", rent: { amount: 142, currency: "GBP", period: "week" }, bills: "excluded", roomType: "Private room", contractWeeks: 48 },
    ],
  },
  {
    publicId: "short-or-long",
    title: "A shorter contract or a lower price?",
    options: [
      { side: "A", displayName: "Harbour Studios", area: "Salford Quays", rent: { amount: 198, currency: "GBP", period: "week" }, bills: "included", roomType: "Studio", contractWeeks: 40 },
      { side: "B", displayName: "Cedar Rooms", area: "Ordsall, Salford", rent: { amount: 165, currency: "GBP", period: "week" }, roomType: "En-suite room", contractWeeks: 51 },
    ],
  },
  {
    publicId: "private-or-shared",
    title: "Private bathroom or shared facilities?",
    options: [
      { side: "A", displayName: "Station House", area: "Manchester city centre", rent: { amount: 210, currency: "GBP", period: "week" }, bills: "included", roomType: "En-suite room", contractWeeks: 44 },
      { side: "B", displayName: "Garden Flats", area: "Rusholme, Manchester", rent: { amount: 138, currency: "GBP", period: "week" }, roomType: "Private room, shared bathroom", contractWeeks: 44 },
    ],
  },
];

const exampleNames = [
  ["Oak House", "River Court"],
  ["Maple Rooms", "Station Studios"],
  ["The Lantern", "Garden Place"],
  ["Cedar House", "Bridge Apartments"],
  ["Willow Court", "Parkside Rooms"],
] as const;

const samplePhotos = [
  { url: "/demo/ensuite-v2.png", alt: "Illustrative student en-suite room" },
  { url: "/demo/studio-v2.png", alt: "Illustrative private student studio" },
  { url: "/demo/bedroom.png", alt: "Illustrative student bedroom" },
  { url: "/demo/kitchen.png", alt: "Illustrative shared kitchen" },
] as const;

function sampleGallery(seed: number) {
  return [samplePhotos[seed % samplePhotos.length], samplePhotos[(seed + 2) % samplePhotos.length]]
    .map((photo) => ({ ...photo, caption: "Illustrative sample image" }));
}

const areaSamples: PublicComparison[] = areas.flatMap((area, areaIndex) =>
  Array.from({ length: 15 }, (_, index) => {
    const names = exampleNames[index % exampleNames.length];
    return {
      publicId: `sample-${areaIndex + 1}-${index + 1}`,
      title: `${names[0]} or ${names[1]} in ${area}?`,
      options: [
        {
          side: "A" as const,
          displayName: `${names[0]} ${index + 1}`,
          area,
          rent: { amount: 140 + ((areaIndex * 7 + index * 11) % 75), currency: "GBP", period: "week" as const },
          bills: index % 2 === 0 ? "included" as const : "excluded" as const,
          roomType: index % 3 === 0 ? "Studio" : "En-suite room",
          contractWeeks: 44,
          gallery: sampleGallery(areaIndex + index),
        },
        {
          side: "B" as const,
          displayName: `${names[1]} ${index + 1}`,
          area,
          rent: { amount: 145 + ((areaIndex * 13 + index * 9) % 70), currency: "GBP", period: "week" as const },
          bills: index % 2 === 0 ? "excluded" as const : "included" as const,
          roomType: index % 3 === 0 ? "Private room" : "Studio",
          contractWeeks: 48,
          gallery: sampleGallery(areaIndex + index + 1),
        },
      ],
    };
  }),
);

export const sampleComparisons: PublicComparison[] = [
  ...originalSamples.map((comparison, index) => ({
    ...comparison,
    options: comparison.options.map((option, side) => ({
      ...option,
      gallery: option.gallery?.length ? option.gallery : sampleGallery(index + side),
    })) as PublicComparison["options"],
  })),
  ...areaSamples,
];
