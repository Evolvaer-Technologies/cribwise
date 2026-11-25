export type LocalOption = {
  name: string;
  area: string;
  weeklyRent: number | null;
  deposit: number | null;
  bills: "included" | "excluded" | "partial" | "unknown";
  internet: "included" | "available" | "unavailable" | "unknown";
  roomType: string;
  contractWeeks: number | null;
  commuteMinutes: number | null;
  commuteMode: "walk" | "cycle" | "transit" | "drive" | "unknown";
  pros: string;
  concerns: string;
  sourceUrl?: string;
  images?: string[];
};

export type LocalComparison = {
  id: string;
  title: string;
  destination: string;
  createdAt: string;
  options: [LocalOption, LocalOption];
  decision?: { side: "A" | "B"; note: string; savedAt: string };
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
    name: value.name.slice(0, 100),
    area: typeof value.area === "string" ? value.area.slice(0, 100) : "",
    weeklyRent: typeof value.weeklyRent === "number" && Number.isFinite(value.weeklyRent) && value.weeklyRent >= 0
      ? value.weeklyRent : null,
    deposit: typeof value.deposit === "number" && Number.isFinite(value.deposit) && value.deposit >= 0
      ? value.deposit : null,
    bills,
    internet: ["included", "available", "unavailable"].includes(String(value.internet))
      ? value.internet as LocalOption["internet"] : "unknown",
    roomType: typeof value.roomType === "string" ? value.roomType.slice(0, 100) : "",
    contractWeeks: typeof value.contractWeeks === "number" && Number.isInteger(value.contractWeeks) &&
      value.contractWeeks > 0 && value.contractWeeks <= 104 ? value.contractWeeks : null,
    commuteMinutes: typeof value.commuteMinutes === "number" && Number.isInteger(value.commuteMinutes) &&
      value.commuteMinutes >= 0 && value.commuteMinutes <= 240 ? value.commuteMinutes : null,
    commuteMode: ["walk", "cycle", "transit", "drive"].includes(String(value.commuteMode))
      ? value.commuteMode as LocalOption["commuteMode"] : "unknown",
    pros: typeof value.pros === "string" ? value.pros.slice(0, 600) : "",
    concerns: typeof value.concerns === "string" ? value.concerns.slice(0, 600) : "",
    sourceUrl: typeof value.sourceUrl === "string" && value.sourceUrl.length <= 2_000 && /^https?:\/\//i.test(value.sourceUrl)
      ? value.sourceUrl : undefined,
    images: Array.isArray(value.images) ? value.images.filter((image): image is string =>
      typeof image === "string" && image.length <= 2_000 && /^https?:\/\//i.test(image)).slice(0, 8) : [],
  };
}

export function normalizeLocalComparisons(stored: unknown): LocalComparison[] {
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((item): LocalComparison[] => {
      if (!isRecord(item) || typeof item.id !== "string" || typeof item.title !== "string" ||
        typeof item.createdAt !== "string" || !Array.isArray(item.options) || item.options.length !== 2) {
        return [];
      }
      const a = normalizeOption(item.options[0]);
      const b = normalizeOption(item.options[1]);
      const rawDecision = isRecord(item.decision) ? item.decision : null;
      const decision: LocalComparison["decision"] = rawDecision && (rawDecision.side === "A" || rawDecision.side === "B") &&
        typeof rawDecision.note === "string" && typeof rawDecision.savedAt === "string"
        ? { side: rawDecision.side as "A" | "B", note: rawDecision.note.slice(0, 1_000), savedAt: rawDecision.savedAt }
        : undefined;
      return a && b ? [{ id: item.id, title: item.title.slice(0, 160), destination: typeof item.destination === "string" ? item.destination.slice(0, 100) : "", createdAt: item.createdAt, options: [a, b], decision }] : [];
    });
}

export function readLocalComparisons(): LocalComparison[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return normalizeLocalComparisons(stored);
  } catch {
    return [];
  }
}

export function saveLocalComparison(comparison: LocalComparison): void {
  const existing = readLocalComparisons().filter((item) => item.id !== comparison.id);
  localStorage.setItem(storageKey, JSON.stringify([comparison, ...existing]));
}

export function deleteLocalComparison(id: string): void {
  const remaining = readLocalComparisons().filter((item) => item.id !== id);
  localStorage.setItem(storageKey, JSON.stringify(remaining));
}

export function restoreLocalComparisons(items: LocalComparison[]): void {
  const copies = items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }));
  localStorage.setItem(storageKey, JSON.stringify([...copies, ...readLocalComparisons()]));
}
