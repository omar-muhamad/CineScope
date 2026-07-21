import { screen, waitFor } from "@testing-library/react";

import ItemCard from "@/components/ui/ItemCard";
import type { HistoryRow } from "@/api/history";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const { fetchHistoryMock, fetchFavoritesMock, fetchWatchlistMock } = vi.hoisted(
  () => ({
    fetchHistoryMock: vi.fn(),
    fetchFavoritesMock: vi.fn(),
    fetchWatchlistMock: vi.fn(),
  }),
);

vi.mock("@/api/history", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/history")>();
  return { ...actual, fetchHistory: fetchHistoryMock };
});

vi.mock("@/api/saved", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/saved")>();
  return {
    ...actual,
    fetchFavorites: fetchFavoritesMock,
    fetchWatchlist: fetchWatchlistMock,
  };
});

const watchedMovieRow: HistoryRow = {
  mediaId: 42,
  mediaType: "movie",
  season: 0,
  episode: 0,
  title: "Seen It",
  posterPath: "p",
  releaseDate: "2024-01-01",
  voteAverage: 7,
  watchedAt: "2026-07-20T10:00:00Z",
};

const cardProps = {
  id: 42,
  imgSrc: "poster",
  releaseDate: "2024",
  media_type: "movie",
  rating: 7,
  title: "Seen It",
};

beforeEach(() => {
  fetchHistoryMock.mockReset();
  fetchFavoritesMock.mockReset().mockResolvedValue([]);
  fetchWatchlistMock.mockReset().mockResolvedValue([]);
});

describe("WatchedBadge on ItemCard", () => {
  it("marks a watched title's poster", async () => {
    fetchHistoryMock.mockResolvedValue([watchedMovieRow]);

    renderWithProviders(<ItemCard {...cardProps} />, { user: testUser });
    expect(await screen.findByLabelText("Watched")).toBeInTheDocument();
  });

  it("stays hidden for unwatched titles", async () => {
    fetchHistoryMock.mockResolvedValue([watchedMovieRow]);

    renderWithProviders(<ItemCard {...cardProps} id={43} title="Not Seen" />, {
      user: testUser,
    });

    await waitFor(() => expect(fetchHistoryMock).toHaveBeenCalled());
    expect(screen.queryByLabelText("Watched")).not.toBeInTheDocument();
  });

  it("stays hidden and fetches nothing when signed out", () => {
    renderWithProviders(<ItemCard {...cardProps} />);

    expect(screen.queryByLabelText("Watched")).not.toBeInTheDocument();
    expect(fetchHistoryMock).not.toHaveBeenCalled();
  });

  it("can be suppressed via showWatchedBadge (history page cards)", async () => {
    fetchHistoryMock.mockResolvedValue([watchedMovieRow]);

    renderWithProviders(<ItemCard {...cardProps} showWatchedBadge={false} />, {
      user: testUser,
    });

    await waitFor(() => expect(fetchFavoritesMock).toHaveBeenCalled());
    expect(screen.queryByLabelText("Watched")).not.toBeInTheDocument();
  });
});
