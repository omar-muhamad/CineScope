import { screen } from "@testing-library/react";

import Search from "@/pages/Search";
import { renderWithProviders } from "@/tests/test-utils";

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    searchMulti: vi.fn(() =>
      Promise.resolve({
        page: 1,
        total_pages: 1,
        results: [
          {
            id: 1,
            media_type: "movie",
            backdrop_path: "b",
            poster_path: "p",
            release_date: "2021-01-01",
            first_air_date: "",
            adult: false,
            vote_average: 7,
            title: "Batman",
            name: "",
          },
        ],
      }),
    ),
  };
});

describe("Search Page", () => {
  it("shows a prompt when there is no search query", () => {
    renderWithProviders(<Search />, { route: "/search" });
    expect(screen.getByText(/find movies and tv shows/i)).toBeInTheDocument();
  });

  it("renders search results when a query is present", async () => {
    renderWithProviders(<Search />, { route: "/search?search=batman" });
    expect(
      screen.queryByText(/find movies and tv shows/i),
    ).not.toBeInTheDocument();
    expect(await screen.findByText("Search Results")).toBeInTheDocument();
    expect(await screen.findByText("Batman")).toBeInTheDocument();
  });
});
