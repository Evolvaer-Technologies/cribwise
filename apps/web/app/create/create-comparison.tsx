"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveLocalComparison, type LocalOption } from "../../lib/local-comparisons";

type OptionInput = {
  name: string;
  area: string;
  weeklyRent: string;
  bills: LocalOption["bills"];
  roomType: string;
  contractWeeks: string;
};

const emptyOption: OptionInput = {
  name: "",
  area: "",
  weeklyRent: "",
  bills: "unknown",
  roomType: "",
  contractWeeks: "",
};

export function CreateComparison() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<[OptionInput, OptionInput]>([
    { ...emptyOption },
    { ...emptyOption },
  ]);
  const [error, setError] = useState("");

  function updateOption(index: 0 | 1, field: keyof OptionInput, value: string) {
    setOptions((current) => {
      const next: [OptionInput, OptionInput] = [{ ...current[0] }, { ...current[1] }];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
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
    });

    const comparison = {
      id: crypto.randomUUID(),
      title: title.trim(),
      createdAt: new Date().toISOString(),
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
      <h1>Compare two places</h1>
      <p>Enter the facts you know. Leave unknown details blank, and check them before deciding.</p>
      <p className="preference-note">This comparison is saved only in this browser. It is not published or shared.</p>
      <form className="create-form" onSubmit={submit}>
        <label className="create-title">What are you deciding?
          <input value={title} onChange={(event) => setTitle(event.target.value)} minLength={4} maxLength={160} required placeholder="e.g. Which home should I choose?" />
        </label>
        <div className="create-options">
          {options.map((option, index) => (
            <fieldset key={index} className="create-option">
              <legend>Option {index === 0 ? "A" : "B"}</legend>
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
        <button className="button" type="submit">Create comparison</button>
      </form>
    </section>
  );
}
