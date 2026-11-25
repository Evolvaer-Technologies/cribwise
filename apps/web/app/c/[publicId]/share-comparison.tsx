"use client";

import { useState } from "react";

export function ShareComparison({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Link copied");
    } catch {
      setMessage("Copy was unavailable. Use your browser’s address bar.");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: `${title} | Cribwise`, url: window.location.href });
      setMessage("");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Sharing was unavailable. You can copy the link instead.");
    }
  }

  return (
    <div className="share-actions">
      <button type="button" onClick={copyLink}>Copy link</button>
      {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
        <button type="button" onClick={share}>Share</button>
      )}
      <span role="status" aria-live="polite">{message}</span>
    </div>
  );
}
