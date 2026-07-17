import { FC, ReactNode } from "react";
import {
  IoArrowDown,
  IoArrowUp,
  IoChevronDown,
  IoClose,
  IoSwapVertical,
} from "react-icons/io5";

import { useGenres } from "@/queries/useGenres";
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
  { length: CURRENT_YEAR - 1949 },
  (_, i) => CURRENT_YEAR - i,
);
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

const sortStateOf = (
  filters: DiscoverFilters,
  field: SortField,
): SortState => {
  if (filters.sort === `${field}.desc`) return "desc";
  if (filters.sort === `${field}.asc`) return "asc";
  return "off";
};

type SortToggle = {
  field: SortField;
  state: SortState;
  onCycle: () => void;
};

type FilterSelectProps = {
  label: string;
  /** Empty string means "no filter". */
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  /** Optional trailing asc/desc toggle rendered inside the pill. */
  sort?: SortToggle;
};

const FilterSelect: FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  children,
  sort,
}) => {
  const SortIcon = sort && SORT_ICONS[sort.state];
  return (
    <div className="flex items-stretch rounded-full border border-white/10 bg-secondary-dark focus-within:ring-1 focus-within:ring-orange">
      <div className="relative">
        <select
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-full cursor-pointer appearance-none bg-transparent py-2 pl-4 pr-8 text-sm outline-hidden ${
            value ? "text-white" : "text-gray"
          }`}
        >
          {children}
        </select>
        <IoChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray" />
      </div>
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
        value={filters.year?.toString() ?? ""}
        onChange={(value) =>
          onChange({ ...filters, year: value ? Number(value) : undefined })
        }
        sort={{
          field: "year",
          state: sortStateOf(filters, "year"),
          onCycle: () => cycleSort("year"),
        }}
      >
        <option value="">All Years</option>
        {YEARS.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label="Filter by rating"
        value={filters.minRating?.toString() ?? ""}
        onChange={(value) =>
          onChange({ ...filters, minRating: value ? Number(value) : undefined })
        }
        sort={{
          field: "rating",
          state: sortStateOf(filters, "rating"),
          onCycle: () => cycleSort("rating"),
        }}
      >
        <option value="">Any Rating</option>
        {MIN_RATINGS.map((rating) => (
          <option key={rating} value={rating}>
            ★ {rating}+
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label="Filter by genre"
        value={filters.genreId?.toString() ?? ""}
        onChange={(value) =>
          onChange({ ...filters, genreId: value ? Number(value) : undefined })
        }
      >
        <option value="">All Genres</option>
        {genres?.map((genre) => (
          <option key={genre.id} value={genre.id}>
            {genre.name}
          </option>
        ))}
      </FilterSelect>
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
