export type LocalOption = {
  name: string;
  area: string;
  weeklyRent: number | null;
  bills: "included" | "excluded" | "partial" | "unknown";
  roomType: string;
  contractWeeks: number | null;
};

export type LocalComparison = {
  id: string;
  title: string;
  createdAt: string;
  options: [LocalOption, LocalOption];
};

const storageKey = "cribwise-local-comparisons";

export function readLocalComparisons(): LocalComparison[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is LocalComparison =>
      typeof item === "object" && item !== null &&
      typeof item.id === "string" && typeof item.title === "string" &&
      typeof item.createdAt === "string" && Array.isArray(item.options) &&
      item.options.length === 2 && item.options.every((option: unknown) =>
        typeof option === "object" && option !== null &&
        "name" in option && typeof option.name === "string" &&
        "area" in option && typeof option.area === "string"));
  } catch {
    return [];
  }
}

export function saveLocalComparison(comparison: LocalComparison): void {
  const existing = readLocalComparisons();
  localStorage.setItem(storageKey, JSON.stringify([comparison, ...existing]));
}
