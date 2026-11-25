export function illustrativeCounts(publicId: string): [number, number] {
  let hash = 0;
  for (const character of publicId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return [35 + (hash % 96), 30 + (Math.floor(hash / 97) % 91)];
}

export function illustrativePercentages(publicId: string): [number, number] {
  const [a, b] = illustrativeCounts(publicId);
  const percentA = Math.round((a / (a + b)) * 100);
  return [percentA, 100 - percentA];
}
