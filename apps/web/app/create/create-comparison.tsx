"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveLocalComparison, type LocalComparison, type LocalOption } from "../../lib/local-comparisons";

type OptionInput = {
  name: string;
  area: string;
  weeklyRent: string;
  bills: LocalOption["bills"];
  roomType: string;
  contractWeeks: string;
  listingUrl: string;
  sourceUrl: string;
};

const emptyOption: OptionInput = {
  name: "",
  area: "",
  weeklyRent: "",
  bills: "unknown",
  roomType: "",
  contractWeeks: "",
  listingUrl: "",
  sourceUrl: "",
};

function inputFromOption(option: LocalOption): OptionInput {
  return {
    name: option.name,
    area: option.area,
    weeklyRent: option.weeklyRent == null ? "" : String(option.weeklyRent),
    bills: option.bills,
    roomType: option.roomType,
    contractWeeks: option.contractWeeks == null ? "" : String(option.contractWeeks),
    listingUrl: option.sourceUrl ?? "",
    sourceUrl: option.sourceUrl ?? "",
  };
}

export function CreateComparison({ initial }: { initial?: LocalComparison }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [options, setOptions] = useState<[OptionInput, OptionInput]>(initial
    ? [inputFromOption(initial.options[0]), inputFromOption(initial.options[1])]
    : [{ ...emptyOption }, { ...emptyOption }]);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState<0 | 1 | null>(null);
  const [extractMessages, setExtractMessages] = useState<[string, string]>(["", ""]);
  const listingUrls = useRef<[string, string]>([
    initial?.options[0].sourceUrl ?? "",
    initial?.options[1].sourceUrl ?? "",
  ]);

  function updateOption(index: 0 | 1, field: keyof OptionInput, value: string) {
    if (field === "listingUrl") listingUrls.current[index] = value;
    setOptions((current) => {
      const next: [OptionInput, OptionInput] = [{ ...current[0] }, { ...current[1] }];
      next[index] = { ...next[index], [field]: value };
      if (field === "listingUrl") next[index].sourceUrl = "";
      return next;
    });
    if (field === "listingUrl") {
      setExtractMessages((current) => {
        const next: [string, string] = [...current];
        next[index] = "";
        return next;
      });
    }
  }

  async function extractFromLink(index: 0 | 1) {
    const url = options[index].listingUrl.trim();
    if (!url) return;
    setExtracting(index);
    setExtractMessages((current) => {
      const next: [string, string] = [...current];
      next[index] = "";
      return next;
    });
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The listing could not be previewed.");
      if (listingUrls.current[index].trim() !== url) return;
      setOptions((current) => {
        if (current[index].listingUrl.trim() !== url) return current;
        const next: [OptionInput, OptionInput] = [{ ...current[0] }, { ...current[1] }];
        next[index] = {
          ...next[index],
          name: result.fields.name ?? next[index].name,
          area: result.fields.area ?? next[index].area,
          weeklyRent: result.fields.weeklyRent === undefined ? next[index].weeklyRent : String(result.fields.weeklyRent),
          bills: result.fields.bills ?? next[index].bills,
          roomType: result.fields.roomType ?? next[index].roomType,
          contractWeeks: result.fields.contractWeeks === undefined ? next[index].contractWeeks : String(result.fields.contractWeeks),
          sourceUrl: result.sourceUrl,
        };
        return next;
      });
      setExtractMessages((current) => {
        const next: [string, string] = [...current];
        next[index] = "Details found. Check every field before saving.";
        return next;
      });
    } catch (cause) {
      if (listingUrls.current[index].trim() !== url) return;
      setExtractMessages((current) => {
        const next: [string, string] = [...current];
        next[index] = cause instanceof Error ? cause.message : "The listing could not be previewed.";
        return next;
      });
    } finally {
      setExtracting(null);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const toOption = (input: OptionInput): LocalOption => ({
      name: input.name.trim(),
      area: input.area.trim(),
      weeklyRent: input.weeklyRent === "" ? null : Number(input.weeklyRent),
      bills: input.bills,
      roomType: input.roomType.trim(),
      contractWeeks: input.contractWeeks === "" ? null : Number(input.contractWeeks),
      sourceUrl: input.sourceUrl || undefined,
    });

    const comparison = {
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim() || `${options[0].name.trim()} or ${options[1].name.trim()}?`.slice(0, 160),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      options: [toOption(options[0]), toOption(options[1])] as [LocalOption, LocalOption],
    };
    try {
      saveLocalComparison(comparison);
      router.push(`/my-comparisons/${comparison.id}`);
    } catch {
      setError("This browser could not save your comparison. Check that site storage is available.");
    }
  }

  return (
    <section className="content create-page">
      <p className="eyebrow">Your decision</p>
      <h1>{initial ? "Edit comparison" : "Compare two places"}</h1>
      <p>Enter the facts you know. Leave unknown details blank, and check them before deciding.</p>
      <p className="preference-note">This comparison is saved only in this browser. It is not published or shared.</p>
      <form className="create-form" onSubmit={submit}>
        <label className="create-title">Comparison question (optional)
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="We'll use the two place names if you leave this blank" />
        </label>
        <div className="create-options">
          {options.map((option, index) => (
            <fieldset key={index} className="create-option">
              <legend>Option {index === 0 ? "A" : "B"}</legend>
              <div className="listing-extract">
                <label>Paste a listing link<input type="url" value={option.listingUrl} onChange={(event) => updateOption(index as 0 | 1, "listingUrl", event.target.value)} placeholder="https://example.com/listing" /></label>
                <button type="button" disabled={!option.listingUrl.trim() || extracting !== null} onClick={() => extractFromLink(index as 0 | 1)}>
                  {extracting === index ? "Reading listing…" : "Extract details"}
                </button>
                {extractMessages[index] && <p role="status">{extractMessages[index]}</p>}
              </div>
              <label>Place name<input value={option.name} onChange={(event) => updateOption(index as 0 | 1, "name", event.target.value)} maxLength={100} required placeholder="Accommodation name" /></label>
              <label>Area<input value={option.area} onChange={(event) => updateOption(index as 0 | 1, "area", event.target.value)} maxLength={100} placeholder="e.g. Fallowfield" /></label>
              <label>Weekly rent (£)<input type="number" min="0" step="0.01" value={option.weeklyRent} onChange={(event) => updateOption(index as 0 | 1, "weeklyRent", event.target.value)} placeholder="Not provided" /></label>
              <label>Bills
                <select value={option.bills} onChange={(event) => updateOption(index as 0 | 1, "bills", event.target.value)}>
                  <option value="unknown">Not provided</option>
                  <option value="included">Included</option>
                  <option value="excluded">Excluded</option>
                  <option value="partial">Partially included</option>
                </select>
              </label>
              <label>Room type<input value={option.roomType} onChange={(event) => updateOption(index as 0 | 1, "roomType", event.target.value)} maxLength={100} placeholder="Not provided" /></label>
              <label>Contract length (weeks)<input type="number" min="1" max="104" step="1" value={option.contractWeeks} onChange={(event) => updateOption(index as 0 | 1, "contractWeeks", event.target.value)} placeholder="Not provided" /></label>
            </fieldset>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        <button className="button" type="submit">{initial ? "Save changes" : "Create comparison"}</button>
      </form>
    </section>
  );
}
