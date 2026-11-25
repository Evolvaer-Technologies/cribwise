"use client";

import { useRef, useState } from "react";

type Photo = { url: string; alt: string; caption?: string };

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  if (photos.length === 0) {
    return <div className="option-media"><div className="media-placeholder"><span aria-hidden="true">⌂</span><strong>No approved photo yet</strong><small>Check the listing source when available</small></div></div>;
  }

  const photo = photos[selected];
  return (
    <div className="gallery">
      <figure className="option-media">
        {/* Generated demo imagery is hosted locally. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <button type="button" className="gallery-open" aria-label={`Open larger view of ${photo.caption ?? photo.alt}`} onClick={() => dialog.current?.showModal()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.alt} />
        </button>
        <figcaption>{photo.caption ?? "Accommodation photo"} · {selected + 1} of {photos.length}</figcaption>
      </figure>
      {photos.length > 1 && (
        <div className="gallery-thumbnails" aria-label="Choose a photo">
          {photos.map((item, index) => (
            <button type="button" key={item.url} aria-label={`Show photo ${index + 1}: ${item.caption ?? item.alt}`} aria-pressed={index === selected} onClick={() => setSelected(index)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" />
            </button>
          ))}
        </div>
      )}
      <dialog className="gallery-dialog" ref={dialog} aria-label="Photo gallery" onKeyDown={(event) => {
        if (event.key === "ArrowRight") setSelected((current) => (current + 1) % photos.length);
        if (event.key === "ArrowLeft") setSelected((current) => (current - 1 + photos.length) % photos.length);
      }}>
        <div className="gallery-dialog-header">
          <span>{selected + 1} of {photos.length} · {photo.caption ?? "Accommodation photo"}</span>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close photo gallery">Close</button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.alt} />
        {photos.length > 1 && (
          <div className="gallery-dialog-controls">
            <button type="button" onClick={() => setSelected((current) => (current - 1 + photos.length) % photos.length)}>Previous photo</button>
            <button type="button" onClick={() => setSelected((current) => (current + 1) % photos.length)}>Next photo</button>
          </div>
        )}
      </dialog>
    </div>
  );
}
