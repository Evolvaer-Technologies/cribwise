"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readLocalComparisons, saveLocalComparison, type LocalComparison, type LocalOption } from "../../../lib/local-comparisons";

const pounds = (amount: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(amount);

function contractRent(option: LocalOption): number | null {
  return option.weeklyRent !== null && option.contractWeeks !== null
    ? option.weeklyRent * option.contractWeeks : null;
}

function OptionDetails({ option, side }: { option: LocalOption; side: "A" | "B" }) {
  const [activeImage, setActiveImage] = useState(0);
  const rent = option.weeklyRent === null ? "Not provided" : `${new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(option.weeklyRent)} per week`;
  const totalRent = contractRent(option);
  const bills = option.bills === "unknown" ? "Not provided" : option.bills === "partial" ? "Partially included" : option.bills === "included" ? "Included" : "Excluded";
  return (
    <article className="option" data-side={side}>
      <p className="option-badge">Option {side}</p>
      {!!option.images?.length && <div className="draft-gallery">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="draft-gallery-main" src={option.images[Math.min(activeImage, option.images.length - 1)]} alt={`${option.name} listing photo ${activeImage + 1}`} referrerPolicy="no-referrer" />
        {option.images.length > 1 && <div className="draft-gallery-thumbs" aria-label={`${option.name} photos`}>
          {option.images.map((image, index) => <button key={image} type="button" aria-label={`Show photo ${index + 1} of ${option.images!.length}`} aria-pressed={activeImage === index} onClick={() => setActiveImage(index)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" />
          </button>)}
        </div>}
      </div>}
      <h2>{option.name}</h2>
      <p>{option.area || "Area not provided"}</p>
      <dl>
        <div><dt>Rent</dt><dd>{rent}</dd></div>
        <div><dt>Bills</dt><dd>{bills}</dd></div>
        <div><dt>Room</dt><dd>{option.roomType || "Not provided"}</dd></div>
        <div><dt>Contract</dt><dd>{option.contractWeeks === null ? "Not provided" : `${option.contractWeeks} weeks`}</dd></div>
        <div><dt>Rent for contract</dt><dd>{totalRent === null ? "Needs rent and contract length" : pounds(totalRent)}</dd></div>
      </dl>
      {option.sourceUrl && /^https?:\/\//i.test(option.sourceUrl) && (
        <a className="source-link" href={option.sourceUrl} target="_blank" rel="noopener noreferrer">View original listing</a>
      )}
    </article>
  );
}

function FactSummary({ options }: { options: [LocalOption, LocalOption] }) {
  const [a, b] = options;
  const facts: string[] = [];

  if (a.weeklyRent !== null && b.weeklyRent !== null) {
    const gap = Math.abs(a.weeklyRent - b.weeklyRent);
    facts.push(gap === 0
      ? "Both places have the same weekly rent in the details provided."
      : `Option ${a.weeklyRent < b.weeklyRent ? "A" : "B"} has a weekly rent ${pounds(gap)} lower than the other option.`);
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

  const totalA = contractRent(a);
  const totalB = contractRent(b);
  if (totalA !== null && totalB !== null) {
    if (a.contractWeeks === b.contractWeeks) {
      const difference = Math.abs(totalA - totalB);
      facts.push(difference === 0
        ? `Both places have ${pounds(totalA)} in rent over the contract.`
        : `Over the same ${a.contractWeeks}-week term, Option ${totalA < totalB ? "A" : "B"} has ${pounds(difference)} less rent.`);
    } else {
      facts.push("The contracts cover different numbers of weeks, so compare each total alongside its length.");
    }
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
      <p className="cost-note">Contract rent is weekly rent multiplied by contract weeks. It excludes any bills, deposits and other charges.</p>
      {missing.length > 0 && <div className="missing-facts"><strong>Still to check</strong><ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul></div>}
      <small>Based on the details saved in this browser. Verify them against the original listings.</small>
    </section>
  );
}

export function LocalComparisonView({ id }: { id: string }) {
  const [comparison, setComparison] = useState<LocalComparison | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<"A" | "B" | "">("");
  const [note, setNote] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");

  useEffect(() => {
    const saved = readLocalComparisons().find((item) => item.id === id) ?? null;
    setComparison(saved);
    setSelected(saved?.decision?.side ?? "");
    setNote(saved?.decision?.note ?? "");
    setReady(true);
  }, [id]);

  function saveDecision() {
    if (!comparison || !selected) return;
    try {
      const updated: LocalComparison = {
        ...comparison,
        decision: { side: selected, note: note.trim(), savedAt: new Date().toISOString() },
      };
      saveLocalComparison(updated);
      setComparison(updated);
      setDecisionMessage("Your decision was saved in this browser.");
    } catch {
      setDecisionMessage("This browser could not save your decision.");
    }
  }

  function clearDecision() {
    if (!comparison) return;
    try {
      const updated = { ...comparison, decision: undefined };
      saveLocalComparison(updated);
      setComparison(updated);
      setSelected("");
      setNote("");
      setDecisionMessage("Your saved decision was cleared.");
    } catch {
      setDecisionMessage("This browser could not clear your decision.");
    }
  }

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
      <section className="decision-panel" aria-labelledby="decision-title">
        <p className="eyebrow">Your choice</p>
        <h2 id="decision-title">Make your decision</h2>
        {comparison.decision && <p className="decision-saved">Currently chosen: Option {comparison.decision.side} · {comparison.options[comparison.decision.side === "A" ? 0 : 1].name}</p>}
        <div className="decision-choices">
          {(["A", "B"] as const).map((side, index) => <button key={side} type="button" aria-pressed={selected === side} onClick={() => { setSelected(side); setDecisionMessage(""); }}>
            Option {side}<span>{comparison.options[index].name}</span>
          </button>)}
        </div>
        <label className="decision-note">Why are you choosing this place? <span>(optional)</span>
          <textarea rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What mattered most to you?" />
        </label>
        <div className="decision-actions">
          <button className="button" type="button" disabled={!selected} onClick={saveDecision}>{comparison.decision ? "Update decision" : "Save decision"}</button>
          {comparison.decision && <button type="button" onClick={clearDecision}>Clear decision</button>}
        </div>
        {decisionMessage && <p role="status">{decisionMessage}</p>}
        <small>Only this browser stores your choice and note.</small>
      </section>
      <div className="actions"><Link className="button" href={`/my-comparisons/${comparison.id}/edit`}>Edit comparison</Link><Link href="/my-comparisons">My comparisons</Link><Link href="/create">Create another</Link></div>
    </section>
  );
}
