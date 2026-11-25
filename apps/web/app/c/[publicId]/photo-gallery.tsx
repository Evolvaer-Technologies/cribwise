"use client";

import { useState } from "react";

type Photo = { url: string; alt: string; caption?: string };

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState(0);
  if (photos.length === 0) {
    return <div className="option-media"><div className="media-placeholder"><span aria-hidden="true">⌂</span><strong>No approved photo yet</strong><small>Check the listing source when available</small></div></div>;
  }

  const photo = photos[selected];
  return (
    <div className="gallery">
      <figure className="option-media">
        {/* Generated demo imagery is hosted locally. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.alt} />
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
    </div>
  );
}
