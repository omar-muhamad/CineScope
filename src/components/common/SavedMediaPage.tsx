import { FC, useMemo, useState } from "react";

import GridLayout from "@/components/layout/GridLayout";
import PageLayout from "@/components/layout/PageLayout";
import Heading from "@/components/ui/Heading";
import ItemCard from "@/components/ui/ItemCard";
import ReactPagination from "@/components/common/ReactPagination";
import Skeleton from "@/components/skeletons/Skeleton";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import type { MediaItem } from "@/types";

const PAGE_SIZE = 20;

type MediaFilter = "all" | "movie" | "tv";

const FILTERS: { key: MediaFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "movie", label: "Movies" },
  { key: "tv", label: "TV Shows" },
];

type SavedMediaPageProps = {
  /** Page title, e.g. "Favorites" or "Watch Later". */
  label: string;
  items: MediaItem[] | null;
  loading: boolean;
};

/** Shared layout for the favorites and watch-later pages. */
const SavedMediaPage: FC<SavedMediaPageProps> = ({ label, items, loading }) => {
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [page, setPage] = useState(1); // 1-based

  const filtered = useMemo(
    () =>
      (items ?? []).filter(
        (item) => filter === "all" || item.media_type === filter,
      ),
    [items, filter],
  );

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  // Clamp in case the list shrank (e.g. an item was removed) below the page.
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const handleFilter = (key: MediaFilter) => {
    setFilter(key);
    setPage(1);
  };

  const handlePageClick = ({ selected }: { selected: number }) => {
    setPage(selected + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PageLayout
      loading={loading}
      skeleton={
        <>
          <Skeleton className="h-9 w-48 rounded-sm" />
          <Skeleton className="mt-4 h-9 w-64 rounded-full" />
          <SkeletonGrid count={14} />
        </>
      }
    >
      <Heading as="h1" className="text-orange font-bold max-md:text-xl">
        {label}
      </Heading>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(({ key, label: filterLabel }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleFilter(key)}
            aria-pressed={filter === key}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              filter === key
                ? "bg-orange text-black"
                : "bg-secondary-dark text-gray hover:text-white"
            }`}
          >
            {filterLabel}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 text-gray">
          {filter === "all"
            ? `Nothing in your ${label} list yet...`
            : `No ${filter === "movie" ? "movies" : "TV shows"} in your ${label} list.`}
        </div>
      ) : (
        <>
          <GridLayout>
            {pageItems.map((item) => {
              const isMovie = item.media_type === "movie";
              const date = isMovie ? item.release_date : item.first_air_date;
              return (
                <ItemCard
                  key={`${item.media_type}-${item.id}`}
                  id={item.id}
                  imgSrc={item.poster_path ?? ""}
                  releaseDate={date?.substring(0, 4) ?? ""}
                  media_type={item.media_type}
                  rating={item.vote_average ?? 0}
                  title={(isMovie ? item.title : item.name) ?? ""}
                />
              );
            })}
          </GridLayout>

          {pageCount > 1 && (
            <div className="pr-6 md:pr-0">
              <ReactPagination
                pageCount={pageCount}
                handlePageClick={handlePageClick}
                page={currentPage}
              />
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default SavedMediaPage;
