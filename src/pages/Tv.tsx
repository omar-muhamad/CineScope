import { FC, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import PageLayout from "@/components/layout/PageLayout";
import ItemCard from "@/components/ui/ItemCard";
import GridLayout from "@/components/layout/GridLayout";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchTv, tvPagination } from "@/redux/tv/tvSlice";
import Heading from "@/components/ui/Heading";
import ReactPagination from "@/components/common/ReactPagination";

const Tv: FC = () => {
  const data = useSelector((state: RootState) => state.tv);
  const dispatch = useDispatch<AppDispatch>();

  const { loading, tv } = data;
  const { page, total_pages, results } = tv;

  const currentItems = results;
  const pageCount = total_pages > 100 ? 100 : total_pages;

  const handlePageClick = async (event: { selected: number }) => {
    await dispatch(tvPagination({ currentPage: event.selected + 1 }));
  };

  useEffect(() => {
    dispatch(fetchTv());
  }, [dispatch]);

  return (
    <PageLayout loading={loading}>
      <Heading as="h1" className="mt-6">
        Popular TV Shows
      </Heading>
      <GridLayout>
        {!loading && currentItems && currentItems.length !== 0
          ? currentItems.map((tvShow) => (
              <ItemCard
                key={tvShow.id}
                id={tvShow.id}
                imgSrc={tvShow.backdrop_path}
                releaseDate={tvShow.first_air_date?.substring(0, 4)}
                media_type="tv"
                ratings={tvShow.adult ? "18+" : "PG"}
                title={tvShow.name}
              />
            ))
          : null}
      </GridLayout>
      <div className="pr-6 md:pr-0">
        <ReactPagination
          pageCount={pageCount}
          handlePageClick={handlePageClick}
          page={page}
        />
      </div>
    </PageLayout>
  );
};

export default Tv;
