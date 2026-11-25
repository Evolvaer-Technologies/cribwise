export type LocalOption = {
  name: string;
  area: string;
  weeklyRent: number | null;
  bills: "included" | "excluded" | "partial" | "unknown";
  roomType: string;
  contractWeeks: number | null;
  sourceUrl?: string;
};

export type LocalComparison = {
  id: string;
  title: string;
  createdAt: string;
  options: [LocalOption, LocalOption];
};

const storageKey = "cribwise-local-comparisons";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOption(value: unknown): LocalOption | null {
  if (!isRecord(value) || typeof value.name !== "string" || !value.name.trim()) return null;
  const bills = ["included", "excluded", "partial"].includes(String(value.bills))
    ? value.bills as LocalOption["bills"]
    : "unknown";

  return {
    name: value.name,
    area: typeof value.area === "string" ? value.area : "",
    weeklyRent: typeof value.weeklyRent === "number" && Number.isFinite(value.weeklyRent) && value.weeklyRent >= 0
      ? value.weeklyRent : null,
    bills,
    roomType: typeof value.roomType === "string" ? value.roomType : "",
    contractWeeks: typeof value.contractWeeks === "number" && Number.isInteger(value.contractWeeks) &&
      value.contractWeeks > 0 && value.contractWeeks <= 104 ? value.contractWeeks : null,
    sourceUrl: typeof value.sourceUrl === "string" && /^https?:\/\//i.test(value.sourceUrl)
      ? value.sourceUrl : undefined,
  };
}

export function readLocalComparisons(): LocalComparison[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((item): LocalComparison[] => {
      if (!isRecord(item) || typeof item.id !== "string" || typeof item.title !== "string" ||
        typeof item.createdAt !== "string" || !Array.isArray(item.options) || item.options.length !== 2) {
        return [];
      }
      const a = normalizeOption(item.options[0]);
      const b = normalizeOption(item.options[1]);
      return a && b ? [{ id: item.id, title: item.title, createdAt: item.createdAt, options: [a, b] }] : [];
    });
  } catch {
    return [];
  }
}

export function saveLocalComparison(comparison: LocalComparison): void {
  const existing = readLocalComparisons().filter((item) => item.id !== comparison.id);
  localStorage.setItem(storageKey, JSON.stringify([comparison, ...existing]));
}
