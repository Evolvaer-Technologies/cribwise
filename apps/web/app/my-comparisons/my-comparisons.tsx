"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { deleteLocalComparison, normalizeLocalComparisons, readLocalComparisons, restoreLocalComparisons, saveLocalComparison, type LocalComparison } from "../../lib/local-comparisons";

export function MyComparisons() {
  const [comparisons, setComparisons] = useState<LocalComparison[]>([]);
  const [ready, setReady] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<"all" | "open" | "decided">("all");
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setComparisons(readLocalComparisons());
    setReady(true);
  }, []);

  function duplicate(comparison: LocalComparison) {
    try {
      const copy: LocalComparison = {
        ...comparison,
        id: crypto.randomUUID(),
        title: `Copy of ${comparison.title}`.slice(0, 160),
        createdAt: new Date().toISOString(),
        decision: undefined,
      };
      saveLocalComparison(copy);
      setComparisons(readLocalComparisons());
      setMessage("Comparison copied. The new copy has no saved decision.");
    } catch {
      setMessage("This browser could not copy the comparison.");
    }
  }

  function remove(id: string) {
    try {
      deleteLocalComparison(id);
      setComparisons(readLocalComparisons());
      setConfirmDelete(null);
      setMessage("Comparison removed from this browser.");
    } catch {
      setMessage("This browser could not remove the comparison.");
    }
  }

  function downloadBackup() {
    const data = JSON.stringify({ format: "cribwise-comparisons-v1", comparisons: readLocalComparisons() }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cribwise-comparisons-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setMessage("Backup downloaded. Keep the file somewhere you can find it later.");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 1_000_000) {
      setMessage("This backup is too large. Choose a file under 1 MB.");
      return;
    }
    try {
      const raw: unknown = JSON.parse(await file.text());
      if (!raw || typeof raw !== "object" || !("format" in raw) || raw.format !== "cribwise-comparisons-v1" ||
        !("comparisons" in raw) || !Array.isArray(raw.comparisons) || raw.comparisons.length > 200) {
        throw new Error("This is not a Cribwise comparisons backup.");
      }
      const restored = normalizeLocalComparisons(raw.comparisons);
      if (restored.length !== raw.comparisons.length || !restored.length) {
        throw new Error("The backup contains incomplete comparisons.");
      }
      restoreLocalComparisons(restored);
      setComparisons(readLocalComparisons());
      setMessage(`${restored.length} comparison${restored.length === 1 ? "" : "s"} restored as new copies.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This backup could not be restored.");
    }
  }

  const search = query.trim().toLocaleLowerCase("en-GB");
  const visibleComparisons = comparisons.filter((comparison) => {
    if (decisionFilter === "open" && comparison.decision) return false;
    if (decisionFilter === "decided" && !comparison.decision) return false;
    return !search || [comparison.title, ...comparison.options.flatMap((option) => [option.name, option.area])]
      .some((value) => value.toLocaleLowerCase("en-GB").includes(search));
  });
  const decidedCount = comparisons.filter((comparison) => comparison.decision).length;

  return (
    <section className="content">
      <p className="eyebrow">Your decisions</p>
      <h1>My comparisons</h1>
      <p>These comparisons are saved in this browser.</p>
      <Link className="button" href="/create">Create a comparison</Link>
      <div className="backup-actions">
        <button type="button" onClick={downloadBackup} disabled={!comparisons.length}>Download backup</button>
        <button type="button" onClick={() => importInput.current?.click()}>Restore backup</button>
        <input ref={importInput} type="file" accept=".json,application/json" onChange={importBackup} aria-label="Choose a Cribwise comparisons backup" />
      </div>
      {message && <p role="status">{message}</p>}
      {ready && comparisons.length === 0 && <div className="empty-area"><h2>No comparisons yet</h2><p>Add two places to get started.</p></div>}
      {comparisons.length > 0 && <div className="library-controls">
        <p>{comparisons.length} total · {decidedCount} decided · {comparisons.length - decidedCount} open</p>
        <label>Search your comparisons
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a place, area or question" />
        </label>
        <label>Decision status
          <select value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value as "all" | "open" | "decided")}>
            <option value="all">All comparisons</option>
            <option value="open">Decision open</option>
            <option value="decided">Decided</option>
          </select>
        </label>
      </div>}
      {comparisons.length > 0 && visibleComparisons.length === 0 && <div className="empty-area"><h2>No matches</h2><p>Try another search or decision status.</p></div>}
      <ul className="saved-list">
        {visibleComparisons.map((comparison) => (
          <li key={comparison.id}>
            <Link href={`/my-comparisons/${comparison.id}`}>{comparison.title}</Link>
            <span>{comparison.options[0].name} vs {comparison.options[1].name}</span>
            {comparison.decision && <span>Chosen: Option {comparison.decision.side} · {comparison.options[comparison.decision.side === "A" ? 0 : 1].name}</span>}
            <div className="draft-actions">
              <button type="button" onClick={() => duplicate(comparison)}>Make a copy</button>
              {confirmDelete === comparison.id ? <>
                <span>Remove this comparison from this browser?</span>
                <button type="button" onClick={() => remove(comparison.id)}>Yes, remove</button>
                <button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button>
              </> : <button type="button" onClick={() => setConfirmDelete(comparison.id)}>Remove</button>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
