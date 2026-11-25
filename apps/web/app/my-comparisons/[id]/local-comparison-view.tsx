"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readLocalComparisons, saveLocalComparison, type LocalComparison, type LocalOption } from "../../../lib/local-comparisons";
import { PhotoGallery } from "../../c/[publicId]/photo-gallery";

const pounds = (amount: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(amount);

function contractRent(option: LocalOption): number | null {
  return option.weeklyRent !== null && option.contractWeeks !== null
    ? option.weeklyRent * option.contractWeeks : null;
}

function OptionDetails({ option, side, destination }: { option: LocalOption; side: "A" | "B"; destination: string }) {
  const rent = option.weeklyRent === null ? "Not provided" : `${new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(option.weeklyRent)} per week`;
  const totalRent = contractRent(option);
  const bills = option.bills === "unknown" ? "Not provided" : option.bills === "partial" ? "Partially included" : option.bills === "included" ? "Included" : "Excluded";
  const internet = option.internet === "unknown" ? "Not provided" : option.internet === "included" ? "Included" : option.internet === "available" ? "Available at extra cost" : "Unavailable";
  const commuteMode = { walk: "walking", cycle: "cycling", transit: "public transport", drive: "driving", unknown: "mode not provided" }[option.commuteMode];
  return (
    <article className="option" data-side={side}>
      <p className="option-badge">Option {side}</p>
      {!!option.images?.length && <PhotoGallery photos={option.images.map((url, index) => ({
        url, alt: `${option.name} listing photo ${index + 1}`, caption: option.name,
      }))} />}
      <h2>{option.name}</h2>
      <p>{option.area || "Area not provided"}</p>
      <dl>
        <div><dt>Rent</dt><dd>{rent}</dd></div>
        <div><dt>Bills</dt><dd>{bills}</dd></div>
        <div><dt>Deposit</dt><dd>{option.deposit === null ? "Not provided" : pounds(option.deposit)}</dd></div>
        <div><dt>Internet</dt><dd>{internet}</dd></div>
        <div><dt>Room</dt><dd>{option.roomType || "Not provided"}</dd></div>
        <div><dt>Contract</dt><dd>{option.contractWeeks === null ? "Not provided" : `${option.contractWeeks} weeks`}</dd></div>
        <div><dt>Rent for contract</dt><dd>{totalRent === null ? "Needs rent and contract length" : pounds(totalRent)}</dd></div>
        {destination && <div><dt>To {destination}</dt><dd>{option.commuteMinutes === null ? "Not provided" : `${option.commuteMinutes} minutes · ${commuteMode}`}</dd></div>}
      </dl>
      {(option.pros || option.concerns) && <div className="option-notes">
        {option.pros && <div><h3>What you like</h3><p>{option.pros}</p></div>}
        {option.concerns && <div><h3>Concerns to check</h3><p>{option.concerns}</p></div>}
      </div>}
      {option.sourceUrl && /^https?:\/\//i.test(option.sourceUrl) && (
        <a className="source-link" href={option.sourceUrl} target="_blank" rel="noopener noreferrer">View original listing</a>
      )}
    </article>
  );
}

function FactSummary({ options, destination }: { options: [LocalOption, LocalOption]; destination: string }) {
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

  if (a.deposit !== null && b.deposit !== null) {
    const gap = Math.abs(a.deposit - b.deposit);
    facts.push(gap === 0
      ? `Both places list a ${pounds(a.deposit)} deposit.`
      : `Option ${a.deposit < b.deposit ? "A" : "B"} lists a deposit ${pounds(gap)} lower.`);
  }

  if (a.internet !== "unknown" && b.internet !== "unknown" && a.internet !== b.internet) {
    facts.push("The internet arrangements differ. Check availability and any extra cost.");
  }

  if (destination && a.commuteMinutes !== null && b.commuteMinutes !== null) {
    const gap = Math.abs(a.commuteMinutes - b.commuteMinutes);
    if (a.commuteMode === b.commuteMode && a.commuteMode !== "unknown") {
      facts.push(gap === 0
        ? `Both listed journeys to ${destination} take ${a.commuteMinutes} minutes by the same mode.`
        : `Option ${a.commuteMinutes < b.commuteMinutes ? "A" : "B"} has a journey to ${destination} ${gap} minutes shorter by the same mode.`);
    } else {
      facts.push(`The journey times to ${destination} use different or unknown travel modes. Check the route before comparing them.`);
    }
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
      option.deposit === null && "deposit",
      option.internet === "unknown" && "internet",
      !option.roomType && "room type",
      option.contractWeeks === null && "contract length",
      destination && option.commuteMinutes === null && "journey time",
      destination && option.commuteMinutes !== null && option.commuteMode === "unknown" && "journey mode",
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

function CostPlanner({ options }: { options: [LocalOption, LocalOption] }) {
  const [weeklyBills, setWeeklyBills] = useState<[string, string]>(["", ""]);
  const estimates = options.map((option, index) => {
    if (option.weeklyRent === null || option.contractWeeks === null) return null;
    const entered = weeklyBills[index].trim();
    if (option.bills !== "included" && entered === "") return null;
    const bills = entered === "" ? 0 : Number(entered);
    if (!Number.isFinite(bills) || bills < 0) return null;
    return (option.weeklyRent + bills) * option.contractWeeks;
  });
  const bothKnown = estimates[0] !== null && estimates[1] !== null;
  const sameTerm = options[0].contractWeeks !== null && options[0].contractWeeks === options[1].contractWeeks;

  return <section className="cost-planner" aria-labelledby="cost-planner-title">
    <p className="eyebrow">Plan your budget</p>
    <h2 id="cost-planner-title">Rent and bills estimate</h2>
    <p>Enter a weekly bills estimate for each place where bills are not included. These figures stay on this page and are not saved.</p>
    <div className="cost-planner-grid">
      {options.map((option, index) => <div className="cost-planner-option" key={index}>
        <strong>Option {index === 0 ? "A" : "B"} · {option.name}</strong>
        {option.bills === "included" ? <p>Bills listed as included. Add an amount only if you expect extra weekly costs.</p> :
          <p>{option.bills === "unknown" ? "Bills arrangement is unknown." : "Allow for bills that are not fully included."}</p>}
        <label>Extra bills per week (£)
          <input type="number" min="0" step="0.01" value={weeklyBills[index]} placeholder={option.bills === "included" ? "0" : "Enter an estimate"} onChange={(event) => setWeeklyBills((current) => {
            const next: [string, string] = [...current];
            next[index] = event.target.value;
            return next;
          })} />
        </label>
        <p className="cost-planner-total">{estimates[index] === null ? "Add rent, contract length and bills estimate" : `${pounds(estimates[index])} over ${option.contractWeeks} weeks`}</p>
        <small>Deposit: {option.deposit === null ? "not provided" : pounds(option.deposit)} · shown separately</small>
      </div>)}
    </div>
    {bothKnown && sameTerm && <p className="cost-planner-gap">Estimated gap over the same contract term: {pounds(Math.abs(estimates[0]! - estimates[1]!))}.</p>}
    {bothKnown && !sameTerm && <p>These contracts cover different lengths. Compare their totals alongside the number of weeks.</p>}
    <small>Estimates exclude deposits, one-off fees and costs you have not entered. Confirm actual bills with each provider.</small>
  </section>;
}

export function LocalComparisonView({ id }: { id: string }) {
  const [comparison, setComparison] = useState<LocalComparison | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<"A" | "B" | "">("");
  const [note, setNote] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");
  const [others, setOthers] = useState<LocalComparison[]>([]);

  useEffect(() => {
    const all = readLocalComparisons();
    const saved = all.find((item) => item.id === id) ?? null;
    setComparison(saved);
    setOthers(all.filter((item) => item.id !== id).slice(0, 3));
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
    <div className="comparison-layout">
    <section className="content">
      <p className="eyebrow">Browser draft</p>
      <h1>{comparison.title}</h1>
      <p>Only this browser has this comparison. Confirm any missing details before deciding.</p>
      <div className="comparison">
        <OptionDetails option={comparison.options[0]} side="A" destination={comparison.destination} />
        <OptionDetails option={comparison.options[1]} side="B" destination={comparison.destination} />
      </div>
      <FactSummary options={comparison.options} destination={comparison.destination} />
      <CostPlanner options={comparison.options} />
      <section className="decision-panel" aria-labelledby="decision-title">
        <p className="eyebrow">Your choice</p>
        <h2 id="decision-title">Make your decision</h2>
        {comparison.decision && <p className="decision-saved">Currently chosen: Option {comparison.decision.side} · {comparison.options[comparison.decision.side === "A" ? 0 : 1].name}</p>}
        <div className="decision-choices">
          {(["A", "B"] as const).map((side, index) => <button key={side} type="button" aria-pressed={selected === side} onClick={() => { setSelected(side); setDecisionMessage(""); }}>
            Option {side}<span>{comparison.options[index].name}</span>
          </button>)}
        </div>
        <label className="decision-reason">Why are you choosing this place? <span>(optional)</span>
          <textarea rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What mattered most to you?" />
        </label>
        <div className="decision-actions">
          <button className="button" type="button" disabled={!selected} onClick={saveDecision}>{comparison.decision ? "Update decision" : "Save decision"}</button>
          {comparison.decision && <button type="button" onClick={clearDecision}>Clear decision</button>}
        </div>
        {decisionMessage && <p role="status">{decisionMessage}</p>}
        <small>Only this browser stores your choice and note.</small>
      </section>
      {comparison.decision && <div className="print-decision">
        <h2>My decision</h2>
        <p>Option {comparison.decision.side}: {comparison.options[comparison.decision.side === "A" ? 0 : 1].name}</p>
        {comparison.decision.note && <p>Reason: {comparison.decision.note}</p>}
      </div>}
      <div className="actions"><Link className="button" href={`/my-comparisons/${comparison.id}/edit`}>Edit comparison</Link><button type="button" className="print-button" onClick={() => window.print()}>Print comparison</button><Link href="/my-comparisons">My comparisons</Link><Link href="/create">Create another</Link></div>
    </section>
    <aside className="comparison-sidebar" aria-label="More about this comparison">
      <section className="sidebar-panel">
        <h2>At a glance</h2>
        <ul className="sidebar-facts">
          <li><span>Places</span><strong>2</strong></li>
          <li><span>Area A</span><strong>{comparison.options[0].area || "Not provided"}</strong></li>
          <li><span>Area B</span><strong>{comparison.options[1].area || "Not provided"}</strong></li>
          <li><span>Decision</span><strong>{comparison.decision ? `Option ${comparison.decision.side}` : "Open"}</strong></li>
          {comparison.destination && <li><span>Journey to</span><strong>{comparison.destination}</strong></li>}
        </ul>
      </section>
      {others.length > 0 && <section className="sidebar-panel">
        <h2>Your other comparisons</h2>
        <ul className="sidebar-links">
          {others.map((item) => <li key={item.id}>
            <Link href={`/my-comparisons/${item.id}`}>{item.title}</Link>
            <span>{item.options[0].name} vs {item.options[1].name}</span>
          </li>)}
        </ul>
        <Link href="/my-comparisons">View all</Link>
      </section>}
      <section className="sidebar-panel">
        <h2>Before you choose</h2>
        <ul className="sidebar-checklist">
          <li>Check bills, deposits and any extra charges.</li>
          <li>Confirm contract dates and cancellation terms.</li>
          <li>Review the original listing for each place.</li>
        </ul>
        <Link href="/how-it-works">How Cribwise works</Link>
      </section>
    </aside>
    </div>
  );
}
