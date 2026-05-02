"use client";
// frontend/components/CitrusImage.tsx

import { useState, useCallback } from "react";

type CitrusImageProps = {
  id: number | string;
  alt: string;
  className?: string;
};

const EXTENSIONS = ["JPG", "jpeg", "jpg", "png", "webp"];
const FALLBACK_IMAGE = "/other_images/no_image.png";

export function CitrusImage({ id, alt, className }: CitrusImageProps) {
  // Track which extension index we're trying
  const [extensionIndex, setExtensionIndex] = useState(0);
  // Track if we've fallen back to no_image.png
  const [useFallback, setUseFallback] = useState(false);

  // Normalize id to number
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;

  // Determine the current image source
  const src = useFallback
    ? FALLBACK_IMAGE
    : extensionIndex < EXTENSIONS.length
      ? `/citrus_images/citrus_${numericId}.${EXTENSIONS[extensionIndex]}`
      : FALLBACK_IMAGE;

  const handleError = useCallback(() => {
    // If we're already showing the fallback, do nothing (prevents infinite loop)
    if (useFallback) {
      return;
    }

    // Try the next extension
    if (extensionIndex < EXTENSIONS.length - 1) {
      setExtensionIndex((prev) => prev + 1);
    } else {
      // All extensions exhausted, use fallback
      setUseFallback(true);
    }
  }, [extensionIndex, useFallback]);

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={handleError}
    />
  );
}
