import { screen } from "@testing-library/react";

import Home from "@/pages/Home";
import { renderWithProviders } from "@/tests/test-utils";

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
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
});
