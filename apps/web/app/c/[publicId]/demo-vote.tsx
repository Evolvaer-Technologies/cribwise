"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { illustrativeCounts } from "../../../lib/sample-poll";

const reasons = [
  ["PRICE", "Price"],
  ["COMMUTE", "Commute"],
  ["LOCATION", "Location"],
  ["ROOM", "Room"],
  ["BILLS", "Bills"],
  ["AMENITIES", "Amenities"],
  ["LIFESTYLE", "Lifestyle"],
  ["OTHER", "Other"],
] as const;

type Vote = { side: "A" | "B"; reason: string; comment?: string };

export function DemoVote({ publicId }: { publicId: string }) {
  const storageKey = `cribwise-demo-vote-${publicId}`;
  const [side, setSide] = useState<"A" | "B" | "">("");
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [vote, setVote] = useState<Vote | null>(null);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);
  const [sampleA, sampleB] = illustrativeCounts(publicId);
  const countA = sampleA + (vote?.side === "A" ? 1 : 0);
  const countB = sampleB + (vote?.side === "B" ? 1 : 0);
  const total = countA + countB;
  const percentA = Math.round((countA / total) * 100);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && typeof saved === "object" && "side" in saved && "reason" in saved &&
        (saved.side === "A" || saved.side === "B") && typeof saved.reason === "string") {
        setVote({
          side: saved.side,
          reason: saved.reason,
          comment: "comment" in saved && typeof saved.comment === "string" ? saved.comment : undefined,
        });
      }
    } catch {
      // An unavailable browser store leaves the form usable for this visit.
    }
    setReady(true);
  }, [storageKey]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!side || !reasons.some(([value]) => value === reason)) return;
    const choice = { side, reason, comment: comment.trim().slice(0, 500) };
    setVote(choice);
    setEditing(false);
    try {
      localStorage.setItem(storageKey, JSON.stringify(choice));
    } catch {
      // Keep the choice visible for this visit.
    }
  }

  return (
    <section className="vote-panel" aria-labelledby="vote-title">
      <p className="eyebrow">Your perspective</p>
      <h2 id="vote-title">Which place would you choose?</h2>
      {ready && vote && !editing ? (
        <>
          <div className="vote-confirmation" role="status">
            <strong>You chose Option {vote.side}</strong>
            <p>Reason: {reasons.find(([value]) => value === vote.reason)?.[1] ?? "Other"}</p>
            {vote.comment && <blockquote className="vote-comment">{vote.comment}</blockquote>}
            <small>Saved on this device for this sample comparison.</small>
          </div>
          <button className="vote-edit" type="button" onClick={() => {
            setSide(vote.side);
            setReason(vote.reason);
            setComment(vote.comment ?? "");
            setEditing(true);
          }}>Change my choice or comment</button>
        </>
      ) : (
        <form onSubmit={submit}>
          <fieldset>
            <legend>Choose an option</legend>
            <div className="vote-options">
              {(["A", "B"] as const).map((value) => (
                <label key={value}><input type="radio" name={`side-${publicId}`} value={value} checked={side === value} onChange={() => setSide(value)} required /> Option {value}</label>
              ))}
            </div>
          </fieldset>
          <label className="vote-reason">What matters most?
            <select value={reason} onChange={(event) => setReason(event.target.value)} required>
              <option value="">Choose a reason</option>
              {reasons.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label className="vote-reason">Add a comment <span className="optional">(optional)</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={4} placeholder="What stood out to you about this option?" />
            <span className="character-count">{comment.length}/500 characters</span>
          </label>
          <div className="vote-form-actions">
            <button className="button" type="submit" disabled={!ready}>{editing ? "Update my choice" : "Record my choice"}</button>
            {editing && <button type="button" onClick={() => setEditing(false)}>Cancel</button>}
          </div>
          <p className="vote-note">Sample interaction. Choices are stored in this browser.</p>
        </form>
      )}
      {ready && <div className="poll-results" aria-label="Illustrative poll results">
        <h3>Illustrative poll results</h3>
        <p>{sampleA + sampleB} fictional sample votes{vote ? " plus your choice saved in this browser" : ""}. These are demonstration figures, not community results.</p>
        {(["A", "B"] as const).map((option) => {
          const percentage = option === "A" ? percentA : 100 - percentA;
          const count = option === "A" ? countA : countB;
          return (
            <div className="result-row" key={option}>
              <div className="result-label"><span>Option {option} · {count} votes</span><strong>{percentage}%</strong></div>
              <div className="result-track" role="meter" aria-label={`Option ${option}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><span style={{ width: `${percentage}%` }} /></div>
            </div>
          );
        })}
      </div>}
    </section>
  );
}
