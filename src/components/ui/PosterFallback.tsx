import { FC } from "react";
import { RiFilmFill } from "react-icons/ri";
import { PiTelevisionSimpleFill } from "react-icons/pi";

type PosterFallbackProps = {
  /** Size/shape it via `className` (width, height, rounding, aspect ratio). */
  className?: string;
  /** Picks the icon: "tv" shows a television, anything else a film reel. */
  media_type?: string;
};

/**
 * Shown in place of a poster/still when TMDB has no image for the item: a
 * muted theme-colored box with a centered media icon, matching the CastCard
 * headshot fallback.
 */
const PosterFallback: FC<PosterFallbackProps> = ({
  className = "",
  media_type,
}) => {
  const Icon = media_type === "tv" ? PiTelevisionSimpleFill : RiFilmFill;
  return (
    <div
      data-testid="poster-fallback"
      className={`bg-secondary-dark flex flex-col items-center justify-center gap-1.5 ${className}`}
    >
      <Icon aria-hidden className="text-4xl text-white/30" />
      <span className="text-xs text-white/30">No image</span>
    </div>
  );
};
export default PosterFallback;
