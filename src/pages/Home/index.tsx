import { FC } from "react";

import PageLayout from "@/components/layout/PageLayout";
import GridLayout from "@/components/layout/GridLayout";
import QueryBoundary from "@/components/common/QueryBoundary";
import ItemCard from "@/components/ui/ItemCard";
import { useTrending } from "./queries/useTrending";
import TrendingCarousel from "./components/TrendingCarousel";
import TrendingCard from "./components/TrendingCard";
import Heading from "@/components/ui/Heading";
import Skeleton from "@/components/skeletons/Skeleton";
import SkeletonGrid from "@/components/skeletons/SkeletonGrid";
import SkeletonTrendingCard from "./components/SkeletonTrendingCard";

// Two rows of cards at the widest grid layout (7 columns at 2xl).
const TWO_ROWS = 14;

/** Trending carousel (mixed movies + TV). */
const TrendingCarouselSection: FC = () => {
  const { data: trending } = useTrending("all");
  return (
    <TrendingCarousel>
      {trending.slice(0, 15).map((item) => {
        const movie = item.media_type === "movie";
        return (
          <TrendingCard
            key={item.id}
            id={item.id}
            imgSrc={item.poster_path}
            releaseDate={
              movie
                ? item.release_date?.substring(0, 4)
                : item.first_air_date?.substring(0, 4)
            }
            media_type={movie ? item.media_type : "tv"}
            rating={item.vote_average}
            title={movie ? item.title : item.name}
          />
        );
      })}
    </TrendingCarousel>
  );
};

const CarouselFallback: FC = () => (
  <TrendingCarousel>
    {Array.from({ length: 8 }).map((_, i) => (
      <SkeletonTrendingCard key={i} />
    ))}
  </TrendingCarousel>
);

/** A trending grid section ("Trending Movies" / "Trending TV Shows"). */
const TrendingGrid: FC<{ scope: "movie" | "tv"; title: string }> = ({
  scope,
  title,
}) => {
  const { data } = useTrending(scope);
  const items = data.slice(0, TWO_ROWS);
  const movie = scope === "movie";
  return (
    <section className="w-full mt-6 md:mt-10">
      <Heading as="h2" className="text-orange font-bold max-md:text-xl">
        {title}
      </Heading>
      <GridLayout>
        {items.map((item) => (
          <ItemCard
            key={item.id}
            id={item.id}
            imgSrc={item.poster_path}
            releaseDate={
              movie
                ? item.release_date?.substring(0, 4)
                : item.first_air_date?.substring(0, 4)
            }
            media_type={scope}
            rating={item.vote_average}
            title={movie ? item.title : item.name}
          />
        ))}
      </GridLayout>
    </section>
  );
};

const GridFallback: FC = () => (
  <section className="w-full mt-6 md:mt-10">
    <Skeleton className="h-8 w-56 rounded-sm" />
    <SkeletonGrid count={TWO_ROWS} />
  </section>
);

const Home: FC = () => {
  return (
    <div>
      <QueryBoundary fallback={<CarouselFallback />}>
        <TrendingCarouselSection />
      </QueryBoundary>
      <PageLayout>
        <QueryBoundary fallback={<GridFallback />}>
          <TrendingGrid scope="movie" title="Trending Movies" />
        </QueryBoundary>
        <QueryBoundary fallback={<GridFallback />}>
          <TrendingGrid scope="tv" title="Trending TV Shows" />
        </QueryBoundary>
      </PageLayout>
    </div>
  );
};
export default Home;
