import { screen } from "@testing-library/react";

import Movies from "@/pages/Movies";
import { renderWithProviders } from "@/tests/test-utils";

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    fetchMediaList: vi.fn(() =>
      Promise.resolve({
        page: 1,
        total_pages: 5,
        results: [
          {
            id: 1,
            media_type: "movie",
            backdrop_path: "b",
            poster_path: "p",
            release_date: "2024-01-01",
            first_air_date: "",
            adult: false,
            vote_average: 8,
            title: "Popular Movie",
            name: "",
          },
        ],
      }),
    ),
  };
});

describe("Movies Page", () => {
  it("renders the popular heading and fetched movies by default", async () => {
    renderWithProviders(<Movies />);
    // Heading lives inside PageLayout's children, shown only after load.
    expect(await screen.findByText("Popular Movie")).toBeInTheDocument();
    expect(screen.getByText("Popular Movies")).toBeInTheDocument();
  });

  it("renders the heading for the category passed as a prop", async () => {
    renderWithProviders(<Movies category="trending" />);
    expect(await screen.findByText("Popular Movie")).toBeInTheDocument();
    expect(screen.getByText("Trending Movies")).toBeInTheDocument();
  });
});
