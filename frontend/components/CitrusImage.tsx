"use client";
// frontend/components/CitrusImage.tsx

import { useState } from "react";

type CitrusImageProps = {
  id: number;
  alt: string;
  className?: string;
};

const EXTENSIONS = ["JPG", "jpeg", "jpg", "png", "webp"];

export function CitrusImage({ id, alt, className }: CitrusImageProps) {
  const [index, setIndex] = useState(0);

  const src =
    index < EXTENSIONS.length
      ? `/citrus_images/citrus_${id}.${EXTENSIONS[index]}`
      : "/other_images/no_image.png";

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => {
        setIndex((current) => {
          if (current < EXTENSIONS.length) {
            return current + 1;
          }

          return current;
        });
      }}
    />
  );
}
