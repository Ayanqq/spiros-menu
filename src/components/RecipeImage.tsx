import { useState } from 'react';

interface RecipeImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Class applied to the broken-image placeholder instead of `className`, for contexts (e.g. a lightbox using max-*) where the image's own sizing classes wouldn't give the placeholder a visible size. */
  fallbackClassName?: string;
}

export default function RecipeImage({ src, alt, className, fallbackClassName }: RecipeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-800 text-neutral-600 ${fallbackClassName ?? className ?? ''}`}
      >
        <svg className="h-1/3 w-1/3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5l5-5.5 4 4 3-3.5L21 16.5M3 5h18M3 5v14a1 1 0 001 1h16a1 1 0 001-1V5M3 5l4-2h10l4 2"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
