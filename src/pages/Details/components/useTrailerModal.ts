import { useState } from "react";

// Owns the trailer modal's state. `openTrailer` always opens the modal so the
// UI can show a "no trailer found" message when there's no key, and only builds
// an embed URL when a YouTube key is available.
export const useTrailerModal = (trailerKey: string | null) => {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openTrailer = () => {
    if (trailerKey) {
      setTrailerUrl(
        `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`,
      );
    }
    setIsOpen(true);
  };

  const closeTrailer = () => {
    setIsOpen(false);
    setTrailerUrl(null);
  };

  return { trailerUrl, isOpen, openTrailer, closeTrailer };
};
