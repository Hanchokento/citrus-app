"use client";
// frontend/components/CitrusImage.tsx

import { useState, useCallback } from "react";

type CitrusImageProps = {
  id: number | string;
  alt: string;
  className?: string;
};

const EXTENSIONS = ["JPG", "jpeg", "jpg", "png", "webp"];

export function CitrusImage({ id, alt, className }: CitrusImageProps) {
  // Track which extension index we're trying
  const [extensionIndex, setExtensionIndex] = useState(0);
  // True when all extensions have failed → show CSS placeholder
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  // Normalize id to number
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;

  const handleError = useCallback(() => {
    if (showPlaceholder) return; // already showing placeholder, do nothing

    if (extensionIndex < EXTENSIONS.length - 1) {
      setExtensionIndex((prev) => prev + 1);
    } else {
      // All extensions exhausted → CSS placeholder
      setShowPlaceholder(true);
    }
  }, [extensionIndex, showPlaceholder]);

  if (showPlaceholder) {
    return (
      <div
        className={`${className ?? ""} citrusImagePlaceholder`}
        role="img"
        aria-label={`${alt}の画像は準備中です`}
      >
        <span className="citrusImagePlaceholderFruit" aria-hidden="true" />
        <span className="citrusImagePlaceholderText">画像準備中</span>
      </div>
    );
  }

  const src = `/citrus_images/citrus_${numericId}.${EXTENSIONS[extensionIndex]}`;

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={handleError}
    />
  );
}