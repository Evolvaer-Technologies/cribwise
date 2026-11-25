export const savedComparisonsKey = "cribwise-saved-comparisons";

export function readSavedComparisons(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(savedComparisonsKey) ?? "[]");
    return Array.isArray(stored) ? stored.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}
