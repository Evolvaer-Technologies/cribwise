"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sampleComparisons } from "../../lib/demo-comparison";
import { readSavedComparisons } from "../../lib/saved-comparisons";

export function SavedList() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readSavedComparisons());
    setReady(true);
  }, []);

  const items = sampleComparisons.filter((comparison) => ids.includes(comparison.publicId));

  return (
    <section className="content">
      <p className="eyebrow">Cribwise</p>
      <h1>Saved comparisons</h1>
      <p>Comparisons saved on this browser appear here.</p>
      {ready && items.length === 0 && (
        <div className="empty-area"><h2>No saved comparisons yet</h2><p>Open a sample comparison and choose “Save comparison” to keep it here.</p><Link href="/#comparisons">Browse comparisons</Link></div>
      )}
      {items.length > 0 && (
        <ul className="saved-list">
          {items.map((comparison) => (
            <li key={comparison.publicId}>
              <Link href={`/c/${comparison.publicId}`}>{comparison.title}</Link>
              <span>{comparison.options[0].displayName} vs {comparison.options[1].displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
