"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { readLocalComparisons, type LocalComparison } from "../lib/local-comparisons";

export function HomeLocalComparisons() {
  const [comparisons, setComparisons] = useState<LocalComparison[]>([]);
  const row = useRef<HTMLDivElement>(null);
  const [firstVisible, setFirstVisible] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    setComparisons(readLocalComparisons().slice(0, 8));
  }, []);

  useEffect(() => {
    if (row.current) setAtEnd(row.current.scrollWidth <= row.current.clientWidth + 2);
  }, [comparisons]);

  function scroll(direction: -1 | 1) {
    if (!row.current) return;
    const target = Math.max(0, Math.min(comparisons.length - 1, firstVisible + direction));
    const card = row.current.children[target] as HTMLElement | undefined;
    if (!card) return;
    const left = row.current.scrollLeft + card.getBoundingClientRect().left - row.current.getBoundingClientRect().left;
    row.current.scrollTo({ left, behavior: "smooth" });
  }

  function updatePosition() {
    if (!row.current) return;
    const container = row.current;
    const cards = Array.from(container.children) as HTMLElement[];
    const left = container.getBoundingClientRect().left;
    const nearest = cards.reduce((best, card, index) =>
      Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[best].getBoundingClientRect().left - left)
        ? index : best, 0);
    setFirstVisible(nearest);
    setAtEnd(container.scrollLeft + container.clientWidth >= container.scrollWidth - 2);
  }

  if (!comparisons.length) return null;

  return (
    <section className="browse-section home-drafts" aria-labelledby="home-drafts-title">
      <div className="browse-heading">
        <div>
          <p className="eyebrow">Saved in this browser</p>
          <h2 id="home-drafts-title">Your comparisons</h2>
          <p>Pick up where you left off or revisit a decision.</p>
        </div>
        <div className="home-drafts-navigation">
          <Link href="/my-comparisons">See all comparisons</Link>
          <span className="carousel-count">Starting at {firstVisible + 1} of {comparisons.length}</span>
          <div className="carousel-controls">
            <button type="button" aria-label="Previous saved comparison" disabled={firstVisible === 0} onClick={() => scroll(-1)}>←</button>
            <button type="button" aria-label="Next saved comparison" disabled={atEnd} onClick={() => scroll(1)}>→</button>
          </div>
        </div>
      </div>
      <div className="comparison-carousel" ref={row} onScroll={updatePosition} aria-label="Your recent comparisons">
        {comparisons.map((comparison) => {
          const chosen = comparison.decision?.side;
          const chosenName = chosen ? comparison.options[chosen === "A" ? 0 : 1].name : null;
          const photos = comparison.options.map((option) => option.images?.[0]);
          return <Link className="browse-card" href={`/my-comparisons/${comparison.id}`} key={comparison.id}>
            <div className="browse-image browse-image-pair">
              {photos.map((photo, index) => <div className="browse-image-half" key={index}>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer" />
                ) : <span aria-hidden="true">⌂</span>}
                <span className="browse-image-side">{index === 0 ? "A" : "B"}</span>
              </div>)}
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
