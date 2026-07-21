import { screen } from "@testing-library/react";

import Home from "@/pages/Home";
import { renderWithProviders, testUser } from "@/tests/test-utils";

vi.mock("@/api/history", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/history")>();
  return {
    ...actual,
    fetchHistory: vi.fn(() =>
      Promise.resolve([
        {
          mediaId: 100,
          mediaType: "tv",
          season: 2,
          episode: 2,
          title: "Watched Show",
          posterPath: "/poster.jpg",
          releaseDate: "2020-01-01",
          voteAverage: 8,
          watchedAt: "2026-07-20T10:00:00Z",
        },
      ]),
    ),
  };
});

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    fetchDetails: vi.fn(() => Promise.resolve({ backdrop_path: "/b.jpg" })),
    fetchTrending: vi.fn(() =>
      Promise.resolve([
        {
          id: 1,
          media_type: "movie",
          backdrop_path: "b",
          poster_path: "p",
          release_date: "2024-01-01",
          first_air_date: "",
          adult: false,
          vote_average: 8,
          title: "Trending Title",
          name: "Trending Name",
        },
      ]),
    ),
  };
});

describe("Home Page", () => {
  it("renders fetched trending items and section headings once loaded", async () => {
    renderWithProviders(<Home />);
    // The grid sections (and their headings) render only after loading ends.
    expect(
      await screen.findAllByAltText(/trending title poster/i),
    ).not.toHaveLength(0);
    expect(screen.getByText("Trending Movies")).toBeInTheDocument();
    expect(screen.getByText("Trending TV Shows")).toBeInTheDocument();
  });

  it("hides the continue-watching row when signed out", async () => {
    renderWithProviders(<Home />);
    await screen.findAllByAltText(/trending title poster/i);
    expect(screen.queryByText("Continue Watching")).not.toBeInTheDocument();
  });

  it("shows the continue-watching row for a signed-in user with history", async () => {
    renderWithProviders(<Home />, { user: testUser });
    expect(await screen.findByText("Continue Watching")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /watched show/i }),
    ).toHaveAttribute("href", "/watch/tv/100");
  });
});
