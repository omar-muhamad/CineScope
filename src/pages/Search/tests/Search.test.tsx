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
            genre_ids: [28],
          },
          {
            id: 2,
            media_type: "movie",
            backdrop_path: "b",
            poster_path: "p",
            release_date: "2019-01-01",
            first_air_date: "",
            adult: false,
            vote_average: 6,
            title: "Superman",
            name: "",
            genre_ids: [12],
          },
        ],
      }),
    ),
    fetchGenres: vi.fn(() => Promise.resolve([{ id: 28, name: "Action" }])),
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

  it("narrows results with filters from the query params", async () => {
    // Both mock results rate below 8, so a ★8+ filter hides everything.
    renderWithProviders(<Search />, {
      route: "/search?search=batman&rating=8",
    });
    expect(
      await screen.findByText(/no results match your search/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Batman")).not.toBeInTheDocument();
  });

  it("keeps results whose genre matches the genre filter", async () => {
    renderWithProviders(<Search />, {
      route: "/search?search=batman&genre=28",
    });
    expect(await screen.findByText("Batman")).toBeInTheDocument();
    expect(screen.queryByText("Superman")).not.toBeInTheDocument();
  });

  it("orders the page by the sort from the query params", async () => {
    // Batman rates 7, Superman 6 — ascending puts Superman first.
    renderWithProviders(<Search />, {
      route: "/search?search=batman&sort=rating.asc",
    });
    const posters = await screen.findAllByAltText(/poster/i);
    expect(posters.map((img) => img.getAttribute("alt"))).toEqual([
      "Superman poster",
      "Batman poster",
    ]);
  });
});
