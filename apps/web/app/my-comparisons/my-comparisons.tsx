"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readLocalComparisons, type LocalComparison } from "../../lib/local-comparisons";

export function MyComparisons() {
  const [comparisons, setComparisons] = useState<LocalComparison[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setComparisons(readLocalComparisons());
    setReady(true);
  }, []);

  return (
    <section className="content">
      <p className="eyebrow">Your decisions</p>
      <h1>My comparisons</h1>
      <p>These comparisons are saved in this browser.</p>
      <Link className="button" href="/create">Create a comparison</Link>
      {ready && comparisons.length === 0 && <div className="empty-area"><h2>No comparisons yet</h2><p>Add two places to get started.</p></div>}
      <ul className="saved-list">
        {comparisons.map((comparison) => (
          <li key={comparison.id}>
            <Link href={`/my-comparisons/${comparison.id}`}>{comparison.title}</Link>
            <span>{comparison.options[0].name} vs {comparison.options[1].name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
