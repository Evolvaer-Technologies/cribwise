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
      {option.sourceUrl && /^https?:\/\//i.test(option.sourceUrl) && (
        <a className="source-link" href={option.sourceUrl} target="_blank" rel="noopener noreferrer">View original listing</a>
      )}
    </article>
  );
}

function FactSummary({ options }: { options: [LocalOption, LocalOption] }) {
  const [a, b] = options;
  const money = (amount: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(amount);
  const facts: string[] = [];

  if (a.weeklyRent !== null && b.weeklyRent !== null) {
    const gap = Math.abs(a.weeklyRent - b.weeklyRent);
    facts.push(gap === 0
      ? "Both places have the same weekly rent in the details provided."
      : `Option ${a.weeklyRent < b.weeklyRent ? "A" : "B"} has a weekly rent ${money(gap)} lower than the other option.`);
  } else {
    facts.push("A weekly rent comparison needs prices for both places.");
  }

  if (a.bills !== "unknown" && b.bills !== "unknown") {
    facts.push(a.bills === b.bills
      ? `Both places list bills as ${a.bills === "partial" ? "partially included" : a.bills}.`
      : "The two places have different bills arrangements. Check the total cost of each.");
  }

  if (a.contractWeeks !== null && b.contractWeeks !== null) {
    facts.push(a.contractWeeks === b.contractWeeks
      ? `Both contracts are ${a.contractWeeks} weeks long.`
      : `Option A has a ${a.contractWeeks}-week contract. Option B has a ${b.contractWeeks}-week contract.`);
  }

  const missing = options.flatMap((option, index) => {
    const fields = [
      option.weeklyRent === null && "rent",
      option.bills === "unknown" && "bills",
      !option.roomType && "room type",
      option.contractWeeks === null && "contract length",
    ].filter((field): field is string => Boolean(field));
    return fields.length ? [`Option ${index === 0 ? "A" : "B"} needs ${fields.join(", ")}`] : [];
  });

  return (
    <section className="summary-panel" aria-labelledby="draft-summary-title">
      <p className="eyebrow">At a glance</p>
      <h2 id="draft-summary-title">Comparison summary</h2>
      <ul className="fact-list">{facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
      {missing.length > 0 && <div className="missing-facts"><strong>Still to check</strong><ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul></div>}
      <small>Based on the details saved in this browser. Verify them against the original listings.</small>
    </section>
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
      <FactSummary options={comparison.options} />
      <div className="actions"><Link className="button" href={`/my-comparisons/${comparison.id}/edit`}>Edit comparison</Link><Link href="/my-comparisons">My comparisons</Link><Link href="/create">Create another</Link></div>
    </section>
  );
}
