"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readLocalComparisons, type LocalComparison, type LocalOption } from "../../../lib/local-comparisons";

function OptionDetails({ option, side }: { option: LocalOption; side: "A" | "B" }) {
  const rent = option.weeklyRent === null ? "Not provided" : `${new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(option.weeklyRent)} per week`;
  const bills = option.bills === "unknown" ? "Not provided" : option.bills === "partial" ? "Partially included" : option.bills === "included" ? "Included" : "Excluded";
  return (
    <article className="option" data-side={side}>
      <p className="option-badge">Option {side}</p>
      <h2>{option.name}</h2>
      <p>{option.area || "Area not provided"}</p>
      <dl>
        <div><dt>Rent</dt><dd>{rent}</dd></div>
        <div><dt>Bills</dt><dd>{bills}</dd></div>
        <div><dt>Room</dt><dd>{option.roomType || "Not provided"}</dd></div>
        <div><dt>Contract</dt><dd>{option.contractWeeks === null ? "Not provided" : `${option.contractWeeks} weeks`}</dd></div>
      </dl>
    </article>
  );
}

export function LocalComparisonView({ id }: { id: string }) {
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
      <p>This comparison may be saved in another browser or may have been removed.</p>
      <Link href="/my-comparisons">My comparisons</Link>
    </section>
  );

  return (
    <section className="content">
      <p className="eyebrow">Browser draft</p>
      <h1>{comparison.title}</h1>
      <p>Only this browser has this comparison. Confirm any missing details before deciding.</p>
      <div className="comparison">
        <OptionDetails option={comparison.options[0]} side="A" />
        <OptionDetails option={comparison.options[1]} side="B" />
      </div>
      <div className="actions"><Link href="/my-comparisons">My comparisons</Link><Link href="/create">Create another</Link></div>
    </section>
  );
}
