import { FC, useEffect, useRef, useState } from "react";
import {
  IoArrowDown,
  IoArrowUp,
  IoChevronDown,
  IoClose,
  IoSwapVertical,
} from "react-icons/io5";

import { useGenres } from "@/queries/useGenres";
import { FILTER_YEAR_MIN } from "@/lib/filterParams";
import {
  hasDiscoverFilters,
  type DiscoverFilters,
  type MediaSort,
  type MediaType,
} from "@/api/tmdb";

type MediaFiltersProps = {
  /** `all` is for the mixed-type search page — it gets the merged genre list. */
  mediaType: MediaType | "all";
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - (FILTER_YEAR_MIN - 1) },
  (_, i) => CURRENT_YEAR - i,
);
// Must stay within FILTER_RATING_MIN..MAX (filterParams.ts) so every option
// survives the URL round-trip.
const MIN_RATINGS = [9, 8, 7, 6, 5];

type SortField = "year" | "rating";
type SortState = "off" | "desc" | "asc";

const SORT_ICONS: Record<SortState, typeof IoSwapVertical> = {
  off: IoSwapVertical,
  desc: IoArrowDown,
  asc: IoArrowUp,
};

const SORT_TITLES: Record<SortField, Record<SortState, string>> = {
  year: {
    off: "Sort by release year",
    desc: "Sorted: newest first",
    asc: "Sorted: oldest first",
  },
  rating: {
    off: "Sort by rating",
    desc: "Sorted: highest rated first",
    asc: "Sorted: lowest rated first",
  },
};

const sortStateOf = (filters: DiscoverFilters, field: SortField): SortState => {
  if (filters.sort === `${field}.desc`) return "desc";
  if (filters.sort === `${field}.asc`) return "asc";
  return "off";
};

type SortToggle = {
  field: SortField;
  state: SortState;
  onCycle: () => void;
};

type FilterOption = { value: string; label: string };

type FilterSelectProps = {
  label: string;
  /** Trigger text when nothing is selected; also the menu's "clear" row. */
  placeholder: string;
  /** Empty string means "no filter". */
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Optional trailing asc/desc toggle rendered inside the pill. */
  sort?: SortToggle;
};

/**
 * Custom listbox instead of a native `<select>` so the menu always opens
 * below the pill (browsers position native select popups themselves, e.g.
 * overlaying the control or flipping upward near the viewport bottom).
 * Outside-click + Escape close behavior matches SeasonSelector/NavDropdown.
 */
const FilterSelect: FC<FilterSelectProps> = ({
  label,
  placeholder,
  value,
  onChange,
  options,
  sort,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const SortIcon = sort && SORT_ICONS[sort.state];
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-stretch rounded-full border border-white/10 bg-secondary-dark focus-within:ring-1 focus-within:ring-orange"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative cursor-pointer py-2 pl-4 pr-8 text-sm outline-hidden ${
          selected ? "text-white" : "text-gray"
        }`}
      >
        {selected?.label ?? placeholder}
        <IoChevronDown
          className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-20 mt-2 max-h-72 w-max min-w-full overflow-y-auto rounded-lg border border-white/10 bg-secondary-dark py-1 shadow-2xl shadow-black/50 animate-dropdown"
        >
          {[{ value: "", label: placeholder }, ...options].map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value || "all"}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(option.value)}
                className={`block w-full whitespace-nowrap px-4 py-2 text-left text-sm ${
                  isActive
                    ? "bg-white/5 text-orange"
                    : "text-gray hover:bg-white/5 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
      {sort && SortIcon && (
        <button
          type="button"
          aria-label={SORT_TITLES[sort.field].off}
          title={SORT_TITLES[sort.field][sort.state]}
          onClick={sort.onCycle}
          className={`grid place-items-center border-l border-white/10 px-2.5 outline-hidden hover:text-white ${
            sort.state === "off" ? "text-gray" : "text-orange"
          }`}
        >
          <SortIcon className="text-sm" />
        </button>
      )}
    </div>
  );
};

/**
 * Year / rating / genre filter row for the browse pages, with asc/desc sort
 * toggles on the year and rating pills (cycling off → desc → asc). One sort
 * key at a time — engaging one toggle releases the other. Only holds UI state
 * plumbing; the owner decides what changed filters mean (discover fetch, page
 * reset).
 */
const MediaFilters: FC<MediaFiltersProps> = ({
  mediaType,
  filters,
  onChange,
}) => {
  // Non-blocking: the select shows only "All Genres" until the list arrives.
  const { data: genres } = useGenres(mediaType);

  const cycleSort = (field: SortField) => {
    const state = sortStateOf(filters, field);
    const sort: MediaSort | undefined =
      state === "off"
        ? `${field}.desc`
        : state === "desc"
          ? `${field}.asc`
          : undefined;
    onChange({ ...filters, sort });
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <FilterSelect
        label="Filter by release year"
        placeholder="All Years"
        value={filters.year?.toString() ?? ""}
        onChange={(value) =>
          onChange({ ...filters, year: value ? Number(value) : undefined })
        }
        options={YEARS.map((year) => ({
          value: String(year),
          label: String(year),
        }))}
        sort={{
          field: "year",
          state: sortStateOf(filters, "year"),
          onCycle: () => cycleSort("year"),
        }}
      />
      <FilterSelect
        label="Filter by rating"
        placeholder="Any Rating"
        value={filters.minRating?.toString() ?? ""}
        onChange={(value) =>
          onChange({ ...filters, minRating: value ? Number(value) : undefined })
        }
        options={MIN_RATINGS.map((rating) => ({
          value: String(rating),
          label: `★ ${rating}+`,
        }))}
        sort={{
          field: "rating",
          state: sortStateOf(filters, "rating"),
          onCycle: () => cycleSort("rating"),
        }}
      />
      <FilterSelect
        label="Filter by genre"
        placeholder="All Genres"
        value={filters.genreId?.toString() ?? ""}
        onChange={(value) =>
          onChange({ ...filters, genreId: value ? Number(value) : undefined })
        }
        options={(genres ?? []).map((genre) => ({
          value: String(genre.id),
          label: genre.name,
        }))}
      />
      {hasDiscoverFilters(filters) && (
        <button
          type="button"
          aria-label="Clear filters"
          title="Clear filters"
          onClick={() => onChange({})}
          className="grid size-9 place-items-center rounded-full border border-white/10 bg-secondary-dark text-gray outline-hidden hover:text-white focus:ring-1 focus:ring-orange"
        >
          <IoClose className="text-lg" />
        </button>
      )}
    </div>
  );
};

export default MediaFilters;
