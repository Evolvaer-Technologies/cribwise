"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sampleComparisons } from "../lib/demo-comparison";
import { areas, areaStorageKey, type Area } from "../lib/areas";
import type { PublicComparison } from "@evolvaer/contracts";

function ComparisonCarousel({ title, items }: { title: string; items: PublicComparison[] }) {
  const row = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    if (!row.current) return;
    row.current.scrollBy({ left: direction * row.current.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="carousel-group" aria-label={title}>
      <div className="browse-heading">
        <div><h3>{title}</h3><span className="carousel-count">{items.length} {items.length === 1 ? "comparison" : "comparisons"}</span></div>
        <div className="carousel-controls">
          <button type="button" aria-label={`Previous comparisons in ${title}`} onClick={() => scroll(-1)}>←</button>
          <button type="button" aria-label={`Next comparisons in ${title}`} onClick={() => scroll(1)}>→</button>
        </div>
      </div>
      <div className="comparison-carousel" ref={row}>
        {items.map((comparison) => {
          const photo = comparison.options[0].gallery?.[0];
          return (
            <Link className="browse-card" href={`/c/${comparison.publicId}`} key={comparison.publicId}>
              <div className="browse-image">
                {photo ? (
                  // Generated sample imagery is hosted locally.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.url} alt="" />
                ) : <span aria-hidden="true">⌂</span>}
              </div>
              <div className="browse-copy">
                <span className="browse-tag">Sample comparison</span>
                <h4>{comparison.title}</h4>
                <p>{comparison.options[0].displayName} vs {comparison.options[1].displayName}</p>
                <strong>Open comparison <span aria-hidden="true">↗</span></strong>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ComparisonBrowse() {
  const [selected, setSelected] = useState<Area[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(areaStorageKey) ?? "[]");
      if (Array.isArray(saved)) {
        setSelected(saved.filter((item): item is Area => areas.includes(item as Area)).slice(0, 5));
      }
    } catch {
      setSelected([]);
    }
  }, []);

  const search = query.trim().toLowerCase();
  const matchesSearch = (comparison: PublicComparison) =>
    !search || [comparison.title, ...comparison.options.flatMap((option) => [option.displayName, option.area ?? ""])]
      .some((value) => value.toLowerCase().includes(search));
  const visibleComparisons = sampleComparisons.filter(matchesSearch);

  return (
    <section className="browse-section" id="comparisons" aria-labelledby="browse-title">
      <div className="browse-heading">
        <div><p className="eyebrow">Explore Cribwise</p><h2 id="browse-title">{selected?.length ? "Your areas" : "Choose a comparison"}</h2></div>
        <Link href="/register">{selected?.length ? "Edit my areas" : "Choose up to five areas"}</Link>
      </div>
      <p className="browse-intro">Fictional examples. Scroll each row to explore.</p>
      <label className="comparison-search">
        <span>Search comparisons</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a place, area or comparison title" />
      </label>
      {selected === null ? <p role="status">Loading comparisons…</p> : selected.length ? selected.map((area) => {
        const items = visibleComparisons.filter((comparison) =>
          comparison.options.some((option) => option.area?.split(",")[0].toLowerCase() === area.toLowerCase()));
        return items.length
          ? <ComparisonCarousel key={area} title={area} items={items} />
          : <div className="empty-area" key={area}><h3>{area}</h3><p>{search ? "No comparisons match your search in this area." : "No sample comparisons in this area yet."}</p></div>;
      }) : visibleComparisons.length
        ? <ComparisonCarousel title="All sample comparisons" items={visibleComparisons} />
        : <div className="empty-area"><h3>No matches</h3><p>Try another place name, area or title.</p></div>}
    </section>
  );
}
