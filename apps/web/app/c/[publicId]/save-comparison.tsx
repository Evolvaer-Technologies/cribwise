"use client";

import { useEffect, useState } from "react";
import { readSavedComparisons, savedComparisonsKey } from "../../../lib/saved-comparisons";

export function SaveComparison({ publicId }: { publicId: string }) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSaved(readSavedComparisons().includes(publicId));
    setReady(true);
  }, [publicId]);

  function toggle() {
    const current = readSavedComparisons();
    const next = saved ? current.filter((id) => id !== publicId) : [...new Set([...current, publicId])];
    try {
      localStorage.setItem(savedComparisonsKey, JSON.stringify(next));
      setSaved(!saved);
      setError("");
    } catch {
      setError("Saving is unavailable in this browser.");
    }
  }

  return (
    <>
      <button type="button" onClick={toggle} disabled={!ready} aria-pressed={saved}>
        {saved ? "Saved ✓" : "Save comparison"}
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
