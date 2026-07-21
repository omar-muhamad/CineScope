import { FC } from "react";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";

import WatchOnline from "..";
import type { HistoryRow } from "@/api/history";
import type { AuthUser } from "@/auth/useAuth";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const {
  fetchDetailsMock,
  fetchSeasonEpisodesMock,
  fetchRecommendationsMock,
  fetchSimilarMock,
  fetchHistoryMock,
} = vi.hoisted(() => ({
  fetchDetailsMock: vi.fn(),
  fetchSeasonEpisodesMock: vi.fn(),
  fetchRecommendationsMock: vi.fn(),
  fetchSimilarMock: vi.fn(),
  fetchHistoryMock: vi.fn(),
}));

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    fetchDetails: fetchDetailsMock,
    fetchSeasonEpisodes: fetchSeasonEpisodesMock,
    fetchRecommendations: fetchRecommendationsMock,
    fetchSimilar: fetchSimilarMock,
  };
});

vi.mock("@/api/history", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/history")>();
  return { ...actual, fetchHistory: fetchHistoryMock };
});

const showDetails = {
  id: 100,
  name: "Test Show",
  first_air_date: "2020-01-01",
  poster_path: "/poster.jpg",
  vote_average: 8,
  seasons: [
    { id: 1, season_number: 1, name: "Season 1", episode_count: 3 },
    { id: 2, season_number: 2, name: "Season 2", episode_count: 3 },
  ],
};

const episodesFor = (season: number) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: season * 100 + i + 1,
    episode_number: i + 1,
    season_number: season,
    name: `S${season}E${i + 1}`,
    overview: "",
    air_date: "2020-01-01",
    vote_average: 0,
    runtime: 20,
    still_path: null,
  }));

const historyRow = (overrides: Partial<HistoryRow>): HistoryRow => ({
  mediaId: 100,
  mediaType: "tv",
  season: 1,
  episode: 1,
  title: "Test Show",
  posterPath: "/poster.jpg",
  releaseDate: "2020-01-01",
  voteAverage: 8,
  watchedAt: "2026-07-20T10:00:00Z",
  ...overrides,
});

const LocationProbe: FC = () => (
  <div data-testid="location">{useLocation().pathname}</div>
);

const renderWatchPage = (route: string, user: AuthUser | null = testUser) =>
  renderWithProviders(
    <>
      <LocationProbe />
      <Routes>
        <Route
          path="/watch/:media_type/:id/:season?/:episode?"
          element={<WatchOnline />}
        />
      </Routes>
    </>,
    { user, route },
  );

const expectLocation = (pathname: string) =>
  waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(pathname),
  );

beforeEach(() => {
  fetchDetailsMock.mockReset().mockResolvedValue(showDetails);
  fetchSeasonEpisodesMock
    .mockReset()
    .mockImplementation((_id, season: number) =>
      Promise.resolve(episodesFor(season)),
    );
  fetchRecommendationsMock.mockReset().mockResolvedValue([]);
  fetchSimilarMock.mockReset().mockResolvedValue([]);
  fetchHistoryMock.mockReset().mockResolvedValue([]);
});

describe("WatchOnline resume", () => {
  it("resumes a bare TV URL at the show's last watched episode", async () => {
    // Newest-first: another title first, then this show's latest episode,
    // then an older one — the S2E2 row must win.
    fetchHistoryMock.mockResolvedValue([
      historyRow({ mediaId: 999, title: "Other Show", season: 4, episode: 4 }),
      historyRow({ season: 2, episode: 2 }),
      historyRow({ season: 1, episode: 3 }),
    ]);

    renderWatchPage("/watch/tv/100");

    await expectLocation("/watch/tv/100/2/2");
    expect(await screen.findByText("S2 - E2")).toBeInTheDocument();
  });

  it("ignores the show-level (0,0) sentinel row when resuming", async () => {
    fetchHistoryMock.mockResolvedValue([
      historyRow({ season: 0, episode: 0 }),
      historyRow({ season: 1, episode: 2 }),
    ]);

    renderWatchPage("/watch/tv/100");
    await expectLocation("/watch/tv/100/1/2");
  });

  it("canonicalizes to S1E1 when the show has no watch history", async () => {
    fetchHistoryMock.mockResolvedValue([
      historyRow({ mediaId: 999, title: "Other Show" }),
    ]);

    renderWatchPage("/watch/tv/100");
    await expectLocation("/watch/tv/100/1/1");
  });

  it("canonicalizes to S1E1 without fetching history when signed out", async () => {
    renderWatchPage("/watch/tv/100", null);

    await expectLocation("/watch/tv/100/1/1");
    expect(fetchHistoryMock).not.toHaveBeenCalled();
  });

  it("leaves an explicit season/episode URL alone", async () => {
    fetchHistoryMock.mockResolvedValue([historyRow({ season: 2, episode: 2 })]);

    renderWatchPage("/watch/tv/100/1/3");

    expect(await screen.findByText("S1 - E3")).toBeInTheDocument();
    await expectLocation("/watch/tv/100/1/3");
  });
});
