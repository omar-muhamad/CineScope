import {
  FC,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import { RiFilmFill } from "react-icons/ri";
import { PiTelevisionSimpleFill } from "react-icons/pi";

import LazyImage from "@/components/ui/LazyImage";
import Skeleton from "@/components/skeletons/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  MIN_SUGGESTION_QUERY_LENGTH,
  useSearchSuggestions,
} from "@/queries/useSearchSuggestions";
import type { MediaSummary } from "@/types";

type NavSearchProps = {
  variant?: "nav" | "block";
  onSearch?: () => void;
};

const variantClasses = {
  nav: "w-32 sm:w-40 focus-within:w-56 sm:focus-within:w-72 transition-[width] duration-300 ease-in-out",
  block: "w-full",
};

// The nav variant anchors right and takes a fixed width so the panel doesn't
// resize with the input's focus animation; the block variant (mobile drawer)
// just spans the input.
const panelVariantClasses = {
  nav: "right-0 w-72 max-w-[calc(100vw-2rem)]",
  block: "inset-x-0",
};

/** How long the input must sit unchanged before suggestions are fetched. */
const SEARCH_DEBOUNCE_MS = 400;

const suggestionPath = (item: MediaSummary) =>
  item.media_type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;

const SuggestionSkeleton: FC = () => (
  <div className="flex items-center gap-3 px-2 py-1.5">
    <Skeleton className="h-14 w-10 shrink-0 rounded" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3.5 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/3 rounded" />
    </div>
  </div>
);

/**
 * Search input with a debounced type-ahead dropdown of the top movie/TV
 * matches. Follows the combobox pattern: focus stays in the input while
 * ArrowUp/ArrowDown move the active option, Enter opens it, and a plain
 * Enter (no active option) submits to the full search page. Escape and
 * outside clicks close the panel, matching the other navbar dropdowns.
 */
const NavSearch: FC<NavSearchProps> = ({ variant = "nav", onSearch }) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const navigate = useNavigate();

  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const showPanel = isOpen && trimmed.length >= MIN_SUGGESTION_QUERY_LENGTH;

  // Passing "" while the panel is closed pauses the fetch (cache is kept).
  const {
    data: suggestions,
    isFetching,
    isPlaceholderData,
  } = useSearchSuggestions(showPanel ? debounced : "");

  // Data on screen lags the input while the debounce or a refetch is pending;
  // existing results dim instead of unmounting (same pattern as the search
  // page's paging transition).
  const isStale = debounced !== trimmed || isFetching || isPlaceholderData;
  const showSkeletons =
    suggestions === undefined || (suggestions.length === 0 && isStale);

  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // A fresh result list can be shorter than the placeholder list the user
  // was arrowing through — an out-of-range index strands the highlight and
  // makes Enter fall through to the full-search submit. Adjusted during
  // render so the stale highlight never reaches the DOM.
  if (activeIndex !== -1 && activeIndex >= (suggestions?.length ?? 0)) {
    setActiveIndex(-1);
  }

  // Close on outside click or Escape, like the other navbar dropdowns.
  // (Inlined setters — the `close` helper is recreated every render and
  // would needlessly churn the effect if listed as a dependency.)
  useEffect(() => {
    if (!showPanel) return;

    const closePanel = () => {
      setIsOpen(false);
      setActiveIndex(-1);
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) closePanel();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPanel]);

  const openSuggestion = (item: MediaSummary) => {
    close();
    navigate(suggestionPath(item));
    onSearch?.();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed) return;
    close();
    navigate(`/search?search=${encodeURIComponent(trimmed)}`);
    onSearch?.();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!showPanel || !suggestions?.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === "Enter" && suggestions[activeIndex]) {
      event.preventDefault();
      openSuggestion(suggestions[activeIndex]);
    }
  };

  // The listbox ul only exists in the results state; pointing aria-controls
  // at it during skeleton/empty states would be a dangling reference.
  const listboxVisible =
    showPanel && !showSkeletons && (suggestions?.length ?? 0) > 0;

  return (
    <div
      ref={containerRef}
      // Tabbing away must close the panel too — the outside-click handler
      // only covers pointers. Option clicks never blur (the panel swallows
      // mousedown), so this doesn't race suggestion navigation.
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node)) {
          close();
        }
      }}
      className={`relative ${variant === "block" ? "w-full" : ""}`}
    >
      <form
        role="search"
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 rounded-full bg-main-dark p-3 focus-within:ring-1 focus-within:ring-orange ${variantClasses[variant]}`}
      >
        <button
          type="submit"
          aria-label="Submit search"
          className="shrink-0 text-gray hover:text-white"
        >
          <IoSearch className="size-5" />
        </button>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          // Focus alone can't reopen after Escape — clicking an already
          // focused input fires no focus event.
          onClick={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          aria-label="Search for movies and TV series"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listboxVisible ? listboxId : undefined}
          aria-activedescendant={
            suggestions?.[activeIndex]
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          className="w-full min-w-0 bg-transparent text-sm outline-hidden caret-orange placeholder:text-gray"
        />
      </form>
      {/* Announce result-count changes to screen readers — the visual panel
          swap is otherwise silent. */}
      {showPanel && (
        <span aria-live="polite" className="sr-only">
          {showSkeletons
            ? ""
            : suggestions.length > 0
              ? `${suggestions.length} suggestions available`
              : "No results"}
        </span>
      )}
      {showPanel && (
        <div
          // Keep focus in the input while clicking options — losing it mid
          // click would collapse the nav variant's focus-width animation and
          // shift the option out from under the cursor.
          onMouseDown={(event) => event.preventDefault()}
          className={`absolute top-full z-50 mt-2 max-h-[min(70vh,26rem)] origin-top overflow-y-auto rounded-lg border border-white/10 bg-main-dark shadow-2xl shadow-black/50 animate-dropdown ${panelVariantClasses[variant]}`}
        >
          {showSkeletons ? (
            <div className="p-2" data-testid="search-suggestions-loading">
              {Array.from({ length: 4 }, (_, index) => (
                <SuggestionSkeleton key={index} />
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <ul
                id={listboxId}
                role="listbox"
                aria-label="Top search results"
                className={`${isStale ? "opacity-60 transition-opacity" : ""}`}
              >
                {suggestions.map((item, index) => {
                  const title = item.title || item.name;
                  const year = (
                    item.release_date || item.first_air_date
                  )?.slice(0, 4);
                  const TypeIcon =
                    item.media_type === "tv"
                      ? PiTelevisionSimpleFill
                      : RiFilmFill;
                  return (
                    <li
                      key={`${item.media_type}-${item.id}`}
                      role="presentation"
                    >
                      <NavLink
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        to={suggestionPath(item)}
                        onClick={() => {
                          close();
                          onSearch?.();
                        }}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/5 ${
                          index === activeIndex ? "bg-white/5" : ""
                        }`}
                      >
                        {item.poster_path ? (
                          <LazyImage
                            className="h-14 w-10 shrink-0 rounded object-cover"
                            src={`https://image.tmdb.org/t/p/w92/${item.poster_path}`}
                            alt={`${title} poster`}
                          />
                        ) : (
                          <div
                            aria-hidden
                            className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-secondary-dark"
                          >
                            <TypeIcon className="text-lg text-white/30" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm">{title}</p>
                          <p className="flex items-center gap-1.5 text-xs text-gray">
                            <TypeIcon aria-hidden />
                            <span>
                              {item.media_type === "tv" ? "TV Show" : "Movie"}
                            </span>
                            {year && (
                              <>
                                <span>•</span>
                                <span>{year}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
              <p className="border-t border-white/10 px-4 py-2 text-xs text-gray">
                Press Enter to see all results
              </p>
            </>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-gray">
              No results for “{debounced}”
            </p>
          )}
        </div>
      )}
    </div>
  );
};
export default NavSearch;
