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
  credits: {
    cast: [],
    crew: [
      {
        id: 1,
        name: "Jane Director",
        job: "Director",
        department: "Directing",
      },
      { id: 2, name: "Sam Scribe", job: "Screenplay", department: "Writing" },
      // Same writer under a second job — should be de-duped, not listed twice.
      { id: 2, name: "Sam Scribe", job: "Story", department: "Writing" },
    ],
  },
  production_companies: [
    {
      id: 10,
      name: "Acme Studios",
      logo_path: "/acme.png",
      origin_country: "US",
    },
    // No logo — filtered out of the studios row.
    { id: 11, name: "No Logo Films", logo_path: null, origin_country: "US" },
  ],
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

    // Director + writer from the appended crew (writer de-duped across jobs).
    expect(screen.getByText("Director")).toBeInTheDocument();
    expect(screen.getByText("Jane Director")).toBeInTheDocument();
    expect(screen.getByText("Writer")).toBeInTheDocument();
    expect(screen.getByText("Sam Scribe")).toBeInTheDocument();

    // Only the logo-bearing studio shows; the logo-less one is filtered out.
    const studioLogo = screen.getByRole("img", { name: "Acme Studios" });
    expect(studioLogo).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w200//acme.png",
    );
    expect(
      screen.queryByRole("img", { name: "No Logo Films" }),
    ).not.toBeInTheDocument();

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
