import { screen } from "@testing-library/react";

import Tv from "@/pages/Tv";
import { renderWithProviders } from "@/tests/test-utils";

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    fetchPopular: vi.fn(() =>
      Promise.resolve({
        page: 1,
        total_pages: 5,
        results: [
          {
            id: 1,
            media_type: "tv",
            backdrop_path: "b",
            poster_path: "p",
            release_date: "",
            first_air_date: "2024-01-01",
            adult: false,
            vote_average: 8,
            title: "",
            name: "Popular Show",
          },
        ],
      }),
    ),
  };
});

describe("Tv Page", () => {
  it("renders the heading and fetched shows", async () => {
    renderWithProviders(<Tv />);
    // Heading lives inside PageLayout's children, shown only after load.
    expect(await screen.findByText("Popular Show")).toBeInTheDocument();
    expect(screen.getByText("Popular TV Shows")).toBeInTheDocument();
  });
});
