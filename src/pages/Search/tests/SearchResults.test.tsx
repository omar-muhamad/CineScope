import { screen } from "@testing-library/react";

import SearchResults from "@/pages/Search/components/SearchResults";
import type { MediaSummary } from "@/types";
import { renderWithProviders } from "@/tests/test-utils";

const results: MediaSummary[] = [
  {
    id: 1,
    media_type: "movie",
    backdrop_path: "backdrop_path",
    poster_path: "poster_path",
    release_date: "2021-01-01",
    first_air_date: "",
    adult: false,
    vote_average: 7,
    title: "Batman",
    name: "",
  },
];

describe("SearchResults", () => {
  it("renders the result titles", () => {
    renderWithProviders(
      <SearchResults
        results={results}
        totalPages={1}
        page={1}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("Search Results")).toBeInTheDocument();
    expect(screen.getByAltText(/batman/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no title results", () => {
    renderWithProviders(
      <SearchResults
        results={[]}
        totalPages={0}
        page={1}
        onPageChange={() => {}}
      />,
    );
    expect(
      screen.getByText(/no results match your search/i),
    ).toBeInTheDocument();
  });
});
