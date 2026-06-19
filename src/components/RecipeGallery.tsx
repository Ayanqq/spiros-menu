import { useEffect, useRef, useState } from 'react';
import type { GalleryImage } from '../types/recipes';
import RecipeImage from './RecipeImage';

interface RecipeGalleryProps {
  images: GalleryImage[];
  title: string;
}

export default function RecipeGallery({ images, title }: RecipeGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const isOpen = lightboxIndex !== null;

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, images.length]);

  if (images.length === 0) return null;

  function showPrev() {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }

  function showNext() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third) showPrev();
    else if (x > third * 2) showNext();
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (deltaX > 50) showPrev();
    else if (deltaX < -50) showNext();
  }

  return (
    <>
      <div className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="relative shrink-0 overflow-hidden rounded-2xl border border-neutral-800 active:scale-[0.98]"
          >
            <RecipeImage
              src={img.url}
              alt={`${title} — фото ${i + 1}`}
              className="h-32 w-32 object-cover sm:h-40 sm:w-40"
            />
            {images.length > 1 && (
              <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-neutral-100">
                {i + 1}/{images.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Закрыть"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900/80 text-neutral-200 hover:text-amber-400"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Предыдущее фото"
                className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/80 text-neutral-200 hover:text-amber-400 sm:flex"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Следующее фото"
                className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/80 text-neutral-200 hover:text-amber-400 sm:flex"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div
            className="flex max-h-full max-w-full items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              if (images.length > 1) handleImageClick(e);
            }}
          >
            <RecipeImage
              src={images[lightboxIndex].url}
              alt={`${title} — фото ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
              fallbackClassName="h-[50vh] w-[80vw] max-w-md rounded-xl"
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i === lightboxIndex ? 'bg-amber-400' : 'bg-neutral-600'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
