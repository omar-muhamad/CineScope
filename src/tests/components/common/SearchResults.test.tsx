import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import SearchResults from "@/components/common/SearchResults";
import { DataState, SearchResult } from "@/redux/search/searchSlice";
import { BrowserRouter } from "react-router-dom";

describe("SearchResults", () => {
  const data: DataState = {
    loading: false,
    searchData: {
      page: 1,
      total_pages: 1,
      results: [
        {
          id: 1,
          media_type: "movie",
          backdrop_path: "backdrop_path",
          release_date: "2021-01-01",
          adult: false,
          title: "title",
        } as SearchResult,
      ],
    },
    error: "",
  };


  it("renders without crashing", () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <SearchResults data={data} />
        </BrowserRouter>
      </Provider>
    );
  });
});
