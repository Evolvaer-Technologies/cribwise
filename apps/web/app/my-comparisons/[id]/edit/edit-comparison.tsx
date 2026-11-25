"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreateComparison } from "../../../create/create-comparison";
import { readLocalComparisons, type LocalComparison } from "../../../../lib/local-comparisons";

export function EditComparison({ id }: { id: string }) {
  const [comparison, setComparison] = useState<LocalComparison | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setComparison(readLocalComparisons().find((item) => item.id === id) ?? null);
    setReady(true);
  }, [id]);

  if (!ready) return <section className="content"><p>Loading comparison…</p></section>;
  if (!comparison) return (
    <section className="content">
      <h1>Comparison unavailable</h1>
      <p>This comparison is not saved in this browser.</p>
      <Link href="/my-comparisons">My comparisons</Link>
    </section>
  );

  return <CreateComparison key={comparison.id} initial={comparison} />;
}
