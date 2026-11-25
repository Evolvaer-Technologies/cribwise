export const areas = [
  "Hulme",
  "Rusholme",
  "Fallowfield",
  "Manchester city centre",
  "Salford",
  "Salford Quays",
  "Withington",
  "Oxford Road",
  "Moss Side",
] as const;

export type Area = (typeof areas)[number];

export const areaStorageKey = "cribwise-areas";
