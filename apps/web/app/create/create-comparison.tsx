"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveLocalComparison, type LocalComparison, type LocalOption } from "../../lib/local-comparisons";

type OptionInput = {
  name: string;
  area: string;
  weeklyRent: string;
  deposit: string;
  bills: LocalOption["bills"];
  internet: LocalOption["internet"];
  roomType: string;
  contractWeeks: string;
  commuteMinutes: string;
  commuteMode: LocalOption["commuteMode"];
  pros: string;
  concerns: string;
  listingUrl: string;
  sourceUrl: string;
  images: string[];
};

const emptyOption: OptionInput = {
  name: "",
  area: "",
  weeklyRent: "",
  deposit: "",
  bills: "unknown",
  internet: "unknown",
  roomType: "",
  contractWeeks: "",
  commuteMinutes: "",
  commuteMode: "unknown",
  pros: "",
  concerns: "",
  listingUrl: "",
  sourceUrl: "",
  images: [],
};

function inputFromOption(option: LocalOption): OptionInput {
  return {
    name: option.name,
    area: option.area,
    weeklyRent: option.weeklyRent == null ? "" : String(option.weeklyRent),
    deposit: option.deposit == null ? "" : String(option.deposit),
    bills: option.bills,
    internet: option.internet,
    roomType: option.roomType,
    contractWeeks: option.contractWeeks == null ? "" : String(option.contractWeeks),
    commuteMinutes: option.commuteMinutes == null ? "" : String(option.commuteMinutes),
    commuteMode: option.commuteMode,
    pros: option.pros,
    concerns: option.concerns,
    listingUrl: option.sourceUrl ?? "",
    sourceUrl: option.sourceUrl ?? "",
    images: option.images ?? [],
  };
}

function usableListingUrl(input: string): string | undefined {
  try {
    if (input.length > 2_000) return undefined;
    const url = new URL(input.trim());
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function CreateComparison({ initial }: { initial?: LocalComparison }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [options, setOptions] = useState<[OptionInput, OptionInput]>(initial
    ? [inputFromOption(initial.options[0]), inputFromOption(initial.options[1])]
    : [{ ...emptyOption }, { ...emptyOption }]);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState<0 | 1 | null>(null);
  const [extractMessages, setExtractMessages] = useState<[string, string]>(["", ""]);
  const [photoLinks, setPhotoLinks] = useState<[string, string]>(["", ""]);
  const [photoMessages, setPhotoMessages] = useState<[string, string]>(["", ""]);
  const listingUrls = useRef<[string, string]>([
    initial?.options[0].sourceUrl ?? "",
    initial?.options[1].sourceUrl ?? "",
  ]);
  const latestExtractRequest = useRef(0);

  function updateOption(index: 0 | 1, field: keyof OptionInput, value: string) {
    if (field === "listingUrl") listingUrls.current[index] = value;
    setOptions((current) => {
      const next: [OptionInput, OptionInput] = [{ ...current[0] }, { ...current[1] }];
      next[index] = { ...next[index], [field]: value };
      if (field === "listingUrl") {
        next[index].sourceUrl = "";
        next[index].images = [];
      }
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

  function addPhoto(index: 0 | 1) {
    const input = photoLinks[index].trim();
    let message = "";
    try {
      const url = new URL(input);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || input.length > 2_000) {
        throw new Error("Use a public http or https photo link.");
      }
      if (options[index].images.includes(url.href)) message = "This photo is already included.";
      else if (options[index].images.length >= 8) message = "Each place can have up to eight photos.";
      else {
        setOptions((current) => {
          const next: [OptionInput, OptionInput] = [{ ...current[0] }, { ...current[1] }];
          next[index].images = [...next[index].images, url.href];
          return next;
        });
        setPhotoLinks((current) => {
          const next: [string, string] = [...current];
          next[index] = "";
          return next;
        });
        message = "Photo added. Check that the preview shows the right place.";
      }
    } catch (cause) {
      message = cause instanceof Error && cause.message.startsWith("Use a public")
        ? cause.message : "Enter a valid photo link starting with https:// or http://.";
    }
    setPhotoMessages((current) => {
      const next: [string, string] = [...current];
      next[index] = message;
      return next;
    });
  }

  async function extractFromLink(index: 0 | 1, pastedUrl?: string) {
    const url = (pastedUrl ?? options[index].listingUrl).trim();
    if (!url) return;
    const requestId = ++latestExtractRequest.current;
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
      if (latestExtractRequest.current !== requestId || listingUrls.current[index].trim() !== url) return;
      const foundFields = Object.entries(result.fields ?? {}).filter(([key, value]) =>
        key !== "images" && value !== undefined && value !== null && value !== "").length;
      const foundPhotos = Array.isArray(result.fields?.images) ? result.fields.images.length : 0;
      setOptions((current) => {
        if (current[index].listingUrl.trim() !== url) return current;
        const next: [OptionInput, OptionInput] = [{ ...current[0] }, { ...current[1] }];
        next[index] = {
          ...next[index],
          name: next[index].name.trim() || result.fields.name || "",
          area: next[index].area.trim() || result.fields.area || "",
          weeklyRent: next[index].weeklyRent || (result.fields.weeklyRent === undefined ? "" : String(result.fields.weeklyRent)),
          deposit: next[index].deposit || (result.fields.deposit === undefined ? "" : String(result.fields.deposit)),
          bills: next[index].bills === "unknown" ? result.fields.bills ?? "unknown" : next[index].bills,
          internet: next[index].internet === "unknown" ? result.fields.internet ?? "unknown" : next[index].internet,
          roomType: next[index].roomType.trim() || result.fields.roomType || "",
          contractWeeks: next[index].contractWeeks || (result.fields.contractWeeks === undefined ? "" : String(result.fields.contractWeeks)),
          sourceUrl: result.sourceUrl,
          images: [...new Set([...next[index].images, ...(Array.isArray(result.fields.images) ? result.fields.images : [])])].slice(0, 8),
        };
        return next;
      });
      setExtractMessages((current) => {
        const next: [string, string] = [...current];
        next[index] = foundFields
          ? `${foundFields} detail${foundFields === 1 ? "" : "s"} and ${foundPhotos} photo${foundPhotos === 1 ? "" : "s"} found. Empty fields were filled and your existing entries were kept. Check every field before saving.`
          : foundPhotos
            ? `${foundPhotos} photo${foundPhotos === 1 ? "" : "s"} found, but no place details. Enter the facts manually before saving.`
            : "No usable details or photos were found on this page. Enter them manually before saving.";
        return next;
      });
    } catch (cause) {
      if (latestExtractRequest.current !== requestId || listingUrls.current[index].trim() !== url) return;
      setExtractMessages((current) => {
        const next: [string, string] = [...current];
        next[index] = cause instanceof Error ? cause.message : "The listing could not be previewed.";
        return next;
      });
    } finally {
      if (latestExtractRequest.current === requestId) setExtracting(null);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (options.some((option) => option.commuteMinutes !== "") && !destination.trim()) {
      setError("Add the journey destination so the travel times have a clear reference point.");
      return;
    }
    setError("");
    const toOption = (input: OptionInput): LocalOption => ({
      name: input.name.trim(),
      area: input.area.trim(),
      weeklyRent: input.weeklyRent === "" ? null : Number(input.weeklyRent),
      deposit: input.deposit === "" ? null : Number(input.deposit),
      bills: input.bills,
      internet: input.internet,
      roomType: input.roomType.trim(),
      contractWeeks: input.contractWeeks === "" ? null : Number(input.contractWeeks),
      commuteMinutes: input.commuteMinutes === "" ? null : Number(input.commuteMinutes),
      commuteMode: input.commuteMode,
      pros: input.pros.trim(),
      concerns: input.concerns.trim(),
      sourceUrl: input.sourceUrl || usableListingUrl(input.listingUrl),
      images: input.images,
    });

    const comparison = {
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim() || `${options[0].name.trim()} or ${options[1].name.trim()}?`.slice(0, 160),
      destination: destination.trim(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      options: [toOption(options[0]), toOption(options[1])] as [LocalOption, LocalOption],
      decision: initial?.decision,
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
        <label className="create-title">Journey destination (optional)
          <input value={destination} onChange={(event) => setDestination(event.target.value)} maxLength={100} placeholder="e.g. University of Manchester" />
        </label>
        <div className="create-options">
          {options.map((option, index) => (
            <fieldset key={index} className="create-option">
              <legend>Option {index === 0 ? "A" : "B"}</legend>
              <div className="listing-extract">
                <label>Paste a listing link<input type="url" value={option.listingUrl} onChange={(event) => updateOption(index as 0 | 1, "listingUrl", event.target.value)} onPaste={(event) => {
                  const pasted = event.clipboardData.getData("text").trim();
                  if (!usableListingUrl(pasted)) return;
                  event.preventDefault();
                  updateOption(index as 0 | 1, "listingUrl", pasted);
                  void extractFromLink(index as 0 | 1, pasted);
                }} placeholder="https://example.com/listing" /></label>
                <button type="button" disabled={!option.listingUrl.trim() || extracting !== null} onClick={() => extractFromLink(index as 0 | 1)}>
                  {extracting === index ? "Reading listing…" : "Extract details"}
                </button>
                {extractMessages[index] && <p role="status">{extractMessages[index]}</p>}
                <p>Pasting a valid link starts extraction. If the website blocks it, enter the details yourself. The link will still be saved.</p>
                <div className="photo-link-entry">
                  <label>Add a photo link<input type="url" value={photoLinks[index]} onChange={(event) => setPhotoLinks((current) => {
                    const next: [string, string] = [...current];
                    next[index] = event.target.value;
                    return next;
                  })} placeholder="https://example.com/room.jpg" /></label>
                  <button type="button" onClick={() => addPhoto(index as 0 | 1)} disabled={!photoLinks[index].trim() || option.images.length >= 8}>Add photo</button>
                  {photoMessages[index] && <p role="status">{photoMessages[index]}</p>}
                </div>
                {option.images.length > 0 && <div className="extracted-images" aria-label={`Option ${index === 0 ? "A" : "B"} listing photos`}>
                  {option.images.map((image) => <div className="extracted-image" key={image}>
                    {/* Listing images come from the external website and may not be available later. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="Listing preview" loading="lazy" referrerPolicy="no-referrer" />
                    <button type="button" aria-label="Remove photo" onClick={() => setOptions((current) => {
                      const next: [OptionInput, OptionInput] = [{ ...current[0] }, { ...current[1] }];
                      next[index].images = next[index].images.filter((item) => item !== image);
                      return next;
                    })}>Remove</button>
                  </div>)}
                </div>}
              </div>
              <label>Place name<input value={option.name} onChange={(event) => updateOption(index as 0 | 1, "name", event.target.value)} maxLength={100} required placeholder="Accommodation name" /></label>
              <label>Area<input value={option.area} onChange={(event) => updateOption(index as 0 | 1, "area", event.target.value)} maxLength={100} placeholder="e.g. Fallowfield" /></label>
              <label>Weekly rent (£)<input type="number" min="0" step="0.01" value={option.weeklyRent} onChange={(event) => updateOption(index as 0 | 1, "weeklyRent", event.target.value)} placeholder="Not provided" /></label>
              <label>Deposit (£)<input type="number" min="0" step="0.01" value={option.deposit} onChange={(event) => updateOption(index as 0 | 1, "deposit", event.target.value)} placeholder="Not provided" /></label>
              <label>Bills
                <select value={option.bills} onChange={(event) => updateOption(index as 0 | 1, "bills", event.target.value)}>
                  <option value="unknown">Not provided</option>
                  <option value="included">Included</option>
                  <option value="excluded">Excluded</option>
                  <option value="partial">Partially included</option>
                </select>
              </label>
              <label>Internet
                <select value={option.internet} onChange={(event) => updateOption(index as 0 | 1, "internet", event.target.value)}>
                  <option value="unknown">Not provided</option>
                  <option value="included">Included</option>
                  <option value="available">Available at extra cost</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </label>
              <label>Room type<input value={option.roomType} onChange={(event) => updateOption(index as 0 | 1, "roomType", event.target.value)} maxLength={100} placeholder="Not provided" /></label>
              <label>Contract length (weeks)<input type="number" min="1" max="104" step="1" value={option.contractWeeks} onChange={(event) => updateOption(index as 0 | 1, "contractWeeks", event.target.value)} placeholder="Not provided" /></label>
              <label>Journey time to destination (minutes)<input type="number" min="0" max="240" step="1" value={option.commuteMinutes} onChange={(event) => updateOption(index as 0 | 1, "commuteMinutes", event.target.value)} placeholder="Not provided" /></label>
              <label>Journey mode
                <select value={option.commuteMode} onChange={(event) => updateOption(index as 0 | 1, "commuteMode", event.target.value)}>
                  <option value="unknown">Not provided</option>
                  <option value="walk">Walking</option>
                  <option value="cycle">Cycling</option>
                  <option value="transit">Public transport</option>
                  <option value="drive">Driving</option>
                </select>
              </label>
              <label>What you like about this place<textarea rows={3} maxLength={600} value={option.pros} onChange={(event) => updateOption(index as 0 | 1, "pros", event.target.value)} placeholder="e.g. Closer to campus, good kitchen" /></label>
              <label>Concerns to check<textarea rows={3} maxLength={600} value={option.concerns} onChange={(event) => updateOption(index as 0 | 1, "concerns", event.target.value)} placeholder="e.g. No deposit information yet" /></label>
            </fieldset>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        <button className="button" type="submit">{initial ? "Save changes" : "Create comparison"}</button>
      </form>
    </section>
  );
}
