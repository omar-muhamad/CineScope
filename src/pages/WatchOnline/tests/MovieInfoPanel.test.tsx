import { screen } from "@testing-library/react";

import MovieInfoPanel from "../components/MovieInfoPanel";
import type { DetailsData } from "@/types";
import { renderWithProviders } from "@/tests/test-utils";

// Stub the OMDb-backed IMDb query so the panel gets a deterministic rating +
// vote count without touching the network.
vi.mock("@/pages/Details/queries/useImdbInfo", () => ({
  useImdbInfo: () => ({ data: { rating: "8.8", votes: "1,234,567" } }),
}));

const details = {
  id: 42,
  title: "Test Movie",
  release_date: "2019-05-01",
  first_air_date: "",
  poster_path: "/poster.jpg",
  backdrop_path: "/backdrop.jpg",
  adult: false,
  name: "",
  genres: [
    { id: 28, name: "Action" },
    { id: 53, name: "Thriller" },
  ],
  vote_average: 7.84,
  overview: "A synopsis for the panel.",
  runtime: 125,
  external_ids: { imdb_id: "tt1234567" },
  videos: { results: [] },
} as unknown as DetailsData;

const saveMeta = {
  title: details.title,
  poster_path: details.poster_path,
  release_date: details.release_date,
  vote_average: details.vote_average,
};

describe("MovieInfoPanel", () => {
  it("surfaces rating, genres, runtime, synopsis and the trailer/IMDb actions", () => {
    // Signed out so the save toggles render their (network-free) logged-out
    // branch — the panel is what's under test, not the bookmarking flow.
    renderWithProviders(
      <MovieInfoPanel id={details.id} details={details} saveMeta={saveMeta} />,
      { user: null },
    );

    expect(screen.getByText("7.8")).toBeInTheDocument();
    // IMDb rating + compact vote count from the stubbed query.
    expect(screen.getByText("8.8")).toBeInTheDocument();
    expect(screen.getByText("(1.2M)")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Thriller")).toBeInTheDocument();
    expect(screen.getByText("2h 5m")).toBeInTheDocument();
    expect(screen.getByText("2019")).toBeInTheDocument();
    expect(screen.getByText("A synopsis for the panel.")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Trailer/i }),
    ).toBeInTheDocument();

    const imdb = screen.getByRole("link", { name: /IMDb/i });
    expect(imdb).toHaveAttribute(
      "href",
      "https://www.imdb.com/title/tt1234567",
    );
  });
});
