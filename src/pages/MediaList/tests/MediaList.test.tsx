import { screen } from "@testing-library/react";

import MediaList from "@/pages/MediaList";
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
            title: "Trending Movie",
            name: "",
          },
        ],
      }),
    ),
  };
});

describe("MediaList Page", () => {
  it("renders the passed title and the fetched items", async () => {
    renderWithProviders(
      <MediaList
        mediaType="movie"
        category="trending"
        title="Trending Movies"
      />,
    );
    // Heading + items render only after the query resolves.
    expect(await screen.findByText("Trending Movie")).toBeInTheDocument();
    expect(screen.getByText("Trending Movies")).toBeInTheDocument();
  });
});
