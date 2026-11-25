"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sampleComparisons } from "../lib/demo-comparison";
import { areas, areaStorageKey, type Area } from "../lib/areas";
import type { PublicComparison } from "@evolvaer/contracts";
import { illustrativePercentages } from "../lib/sample-poll";

function ComparisonCarousel({ title, items }: { title: string; items: PublicComparison[] }) {
  const row = useRef<HTMLDivElement>(null);
  const [firstVisible, setFirstVisible] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const container = row.current;
    if (!container) return;
    container.scrollLeft = 0;
    setFirstVisible(0);
    setAtEnd(container.scrollWidth <= container.clientWidth + 2);
  }, [items]);

  function scroll(direction: -1 | 1) {
    if (!row.current) return;
    const target = Math.max(0, Math.min(items.length - 1, firstVisible + direction));
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

  return (
    <section className="carousel-group" aria-label={title}>
      <div className="browse-heading">
        <div><h3>{title}</h3><span className="carousel-count">{items.length} {items.length === 1 ? "comparison" : "comparisons"} · starting at {firstVisible + 1}</span></div>
        <div className="carousel-controls">
          <button type="button" aria-label={`Previous comparison in ${title}`} disabled={firstVisible === 0} onClick={() => scroll(-1)}>←</button>
          <button type="button" aria-label={`Next comparison in ${title}`} disabled={atEnd} onClick={() => scroll(1)}>→</button>
        </div>
      </div>
      <div className="comparison-carousel" ref={row} onScroll={updatePosition}>
        {items.map((comparison) => {
          const photos = comparison.options.map((option) => option.gallery?.[0]);
          const [percentA, percentB] = illustrativePercentages(comparison.publicId);
          return (
            <Link className="browse-card" href={`/c/${comparison.publicId}`} key={comparison.publicId}>
              <div className="browse-image browse-image-pair">
                {photos.map((photo, index) => <div className="browse-image-half" key={index}>
                  {photo ? (
                    // Generated sample imagery is hosted locally.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt="" loading="lazy" />
                  ) : <span aria-hidden="true">⌂</span>}
                  <span className="browse-image-side">{index === 0 ? "A" : "B"}</span>
                </div>)}
                <small className="browse-image-label">Illustrative images</small>
              </div>
              <div className="browse-copy">
                <span className="browse-tag">Sample comparison</span>
                <h4>{comparison.title}</h4>
                <p>{comparison.options[0].displayName} vs {comparison.options[1].displayName}</p>
                <div className="browse-poll" role="group" aria-label={`Illustrative poll: Option A ${percentA} percent, Option B ${percentB} percent`}>
                  <span>Sample poll</span><strong>A {percentA}%</strong><strong>B {percentB}%</strong>
                  <div className="browse-poll-bar" aria-hidden="true"><span style={{ width: `${percentA}%` }} /><span style={{ width: `${percentB}%` }} /></div>
                </div>
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
  const [maxRent, setMaxRent] = useState("");
  const [billsIncluded, setBillsIncluded] = useState(false);
  const [roomType, setRoomType] = useState<"any" | "studio" | "en-suite" | "private">("any");

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
  const maxWeeklyRent = maxRent === "" ? null : Number(maxRent);
  const visibleComparisons = sampleComparisons.filter((comparison) =>
    matchesSearch(comparison) && comparison.options.some((option) =>
      (maxWeeklyRent === null || (option.rent?.period === "week" && option.rent.amount <= maxWeeklyRent)) &&
      (!billsIncluded || option.bills === "included") &&
      (roomType === "any" || option.roomType?.toLowerCase().includes(roomType))));
  const hasFilters = query !== "" || maxRent !== "" || billsIncluded || roomType !== "any";

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
      <div className="browse-filters" aria-label="Filter comparisons">
        <label>Maximum weekly rent (£)
          <input type="number" min="0" step="1" value={maxRent} onChange={(event) => setMaxRent(event.target.value)} placeholder="Any price" />
        </label>
        <label>Room type
          <select value={roomType} onChange={(event) => setRoomType(event.target.value as typeof roomType)}>
            <option value="any">Any room</option>
            <option value="studio">Studio</option>
            <option value="en-suite">En-suite</option>
            <option value="private">Private room</option>
          </select>
        </label>
        <label className="browse-filter-check"><input type="checkbox" checked={billsIncluded} onChange={(event) => setBillsIncluded(event.target.checked)} /> Bills included</label>
        {hasFilters && <button type="button" onClick={() => { setQuery(""); setMaxRent(""); setBillsIncluded(false); setRoomType("any"); }}>Clear filters</button>}
      </div>
      {hasFilters && <p className="browse-intro">Showing comparisons with at least one place that matches your filters.</p>}
      {selected === null ? <p role="status">Loading comparisons…</p> : selected.length ? selected.map((area) => {
        const items = visibleComparisons.filter((comparison) =>
          comparison.options.some((option) => option.area?.split(",")[0].toLowerCase() === area.toLowerCase()));
        return items.length
          ? <ComparisonCarousel key={area} title={area} items={items} />
          : <div className="empty-area" key={area}><h3>{area}</h3><p>{hasFilters ? "No comparisons match your filters in this area." : "No sample comparisons in this area yet."}</p></div>;
      }) : visibleComparisons.length
        ? <ComparisonCarousel title="All sample comparisons" items={visibleComparisons} />
        : <div className="empty-area"><h3>No matches</h3><p>Try another place name, area or title.</p></div>}
    </section>
  );
}
