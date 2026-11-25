"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { areas, areaStorageKey, type Area } from "../lib/areas";

export function AreaPreferences() {
  const router = useRouter();
  const [selected, setSelected] = useState<Area[]>([]);

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

  function toggle(area: Area) {
    setSelected((current) => current.includes(area)
      ? current.filter((item) => item !== area)
      : current.length < 5 ? [...current, area] : current);
  }

  function save() {
    try {
      localStorage.setItem(areaStorageKey, JSON.stringify(selected));
    } catch {
      return;
    }
    router.push("/");
  }

  return (
    <section className="content preferences">
      <p className="eyebrow">Personalise Cribwise</p>
      <h1>Which areas do you know?</h1>
      <p>Choose up to five places. Your home page will show a separate comparison carousel for each one.</p>
      <p className="preference-note">These choices are saved in this browser.</p>
      <fieldset>
        <legend>Choose areas <span>{selected.length} of 5 selected</span></legend>
        <div className="area-choices">
          {areas.map((area) => (
            <label key={area} className="area-choice">
              <input type="checkbox" checked={selected.includes(area)} disabled={selected.length === 5 && !selected.includes(area)} onChange={() => toggle(area)} />
              <span>{area}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="actions">
        <button className="button" type="button" disabled={selected.length === 0} onClick={save}>Show my comparisons</button>
        <Link href="/">Browse all examples</Link>
      </div>
    </section>
  );
}
