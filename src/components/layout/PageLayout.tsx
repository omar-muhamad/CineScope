import { FC, ReactNode, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import SearchBox from "../common/SearchBox";
import SearchResults from "../common/SearchResults";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchSearch } from "@/redux/search/searchSlice";
import Loading from "../common/Loading";

type PageLayoutProps = { children: ReactNode; loading: boolean };

const PageLayout: FC<PageLayoutProps> = ({ children, loading }) => {
  const searchData = useSelector((state: RootState) => state.search);
  const dispatch = useDispatch<AppDispatch>();

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");

  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      dispatch(fetchSearch({ query }));
    }
  }, [searchParams, dispatch]);
  return (
    <main className="w-full md:w-[calc(100%-8rem)] min-h-screen py-6 md:ml-32 pl-5 md:px-0">
      {loading ? (
        <Loading />
      ) : (
        <>
          <SearchBox />
          {searchQuery ? <SearchResults data={searchData} /> : children}
        </>
      )}
    </main>
  );
};
export default PageLayout;
