"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readLocalComparisons, type LocalComparison } from "../lib/local-comparisons";

export function HomeLocalComparisons() {
  const [comparisons, setComparisons] = useState<LocalComparison[]>([]);

  useEffect(() => {
    setComparisons(readLocalComparisons().slice(0, 8));
  }, []);

  if (!comparisons.length) return null;

  return (
    <section className="browse-section home-drafts" aria-labelledby="home-drafts-title">
      <div className="browse-heading">
        <div>
          <p className="eyebrow">Saved in this browser</p>
          <h2 id="home-drafts-title">Your comparisons</h2>
          <p>Pick up where you left off or revisit a decision.</p>
        </div>
        <Link href="/my-comparisons">See all comparisons</Link>
      </div>
      <div className="comparison-carousel" aria-label="Your recent comparisons">
        {comparisons.map((comparison) => {
          const chosen = comparison.decision?.side;
          const chosenName = chosen ? comparison.options[chosen === "A" ? 0 : 1].name : null;
          const firstImage = comparison.options[0].images?.[0] ?? comparison.options[1].images?.[0];
          return <Link className="browse-card" href={`/my-comparisons/${comparison.id}`} key={comparison.id}>
            <div className="browse-image">
              {firstImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firstImage} alt="" loading="lazy" referrerPolicy="no-referrer" />
              ) : <span aria-hidden="true">⌂</span>}
            </div>
            <div className="browse-copy">
              <span className="browse-tag">{chosenName ? `Chosen · ${chosenName}` : "Decision open"}</span>
              <h3>{comparison.title}</h3>
              <p>{comparison.options[0].name} vs {comparison.options[1].name}</p>
              <strong>Open comparison →</strong>
            </div>
          </Link>;
        })}
      </div>
    </section>
  );
}
