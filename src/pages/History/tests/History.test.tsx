import { fireEvent, screen, waitFor } from "@testing-library/react";

import History from "@/pages/History";
import type { HistoryRow } from "@/api/history";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const {
  fetchHistoryMock,
  removeHistoryForMock,
  clearHistoryMock,
  fetchFavoritesMock,
  fetchWatchlistMock,
} = vi.hoisted(() => ({
  fetchHistoryMock: vi.fn(),
  removeHistoryForMock: vi.fn(),
  clearHistoryMock: vi.fn(),
  fetchFavoritesMock: vi.fn(),
  fetchWatchlistMock: vi.fn(),
}));

vi.mock("@/api/history", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/history")>();
  return {
    ...actual,
    fetchHistory: fetchHistoryMock,
    removeHistoryFor: removeHistoryForMock,
    clearHistory: clearHistoryMock,
  };
});

// The cards' SaveActions read the favorites/watch-later caches when signed in.
vi.mock("@/api/saved", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/saved")>();
  return {
    ...actual,
    fetchFavorites: fetchFavoritesMock,
    fetchWatchlist: fetchWatchlistMock,
  };
});

const showRow = (episode: number, watchedAt: string): HistoryRow => ({
  mediaId: 100,
  mediaType: "tv",
  season: 1,
  episode,
  title: "Test Show",
  posterPath: "p",
  releaseDate: "2024-01-01",
  voteAverage: 8,
  watchedAt,
});

const movieRow: HistoryRow = {
  mediaId: 200,
  mediaType: "movie",
  season: 0,
  episode: 0,
  title: "Test Movie",
  posterPath: "p2",
  releaseDate: "2023-05-05",
  voteAverage: 7,
  watchedAt: "2026-07-19T10:00:00Z",
};

beforeEach(() => {
  fetchHistoryMock.mockReset();
  removeHistoryForMock.mockReset();
  clearHistoryMock.mockReset();
  fetchFavoritesMock.mockReset().mockResolvedValue([]);
  fetchWatchlistMock.mockReset().mockResolvedValue([]);
});

describe("History Page", () => {
  it("groups a show's episode rows into a single card, newest first", async () => {
    fetchHistoryMock.mockResolvedValue([
      showRow(2, "2026-07-21T10:00:00Z"),
      showRow(1, "2026-07-20T10:00:00Z"),
      movieRow,
    ]);

    renderWithProviders(<History />, { user: testUser });

    expect(await screen.findByText("Test Movie")).toBeInTheDocument();
    // Two episode rows of the same show → exactly one card.
    expect(screen.getAllByText("Test Show")).toHaveLength(1);
  });

  it("removes a whole title from history via the card's remove button", async () => {
    // Mock server mirrors the removal so the post-mutation refetch agrees.
    let rows: HistoryRow[] = [showRow(2, "2026-07-21T10:00:00Z"), movieRow];
    fetchHistoryMock.mockImplementation(() => Promise.resolve([...rows]));
    removeHistoryForMock.mockImplementation(
      (_mediaType: string, mediaId: number) => {
        rows = rows.filter((row) => row.mediaId !== mediaId);
        return Promise.resolve();
      },
    );

    renderWithProviders(<History />, { user: testUser });

    expect(await screen.findByText("Test Show")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Remove Test Show"));

    // Optimistically removed, and the refetch keeps it gone.
    await waitFor(() =>
      expect(screen.queryByText("Test Show")).not.toBeInTheDocument(),
    );
    expect(removeHistoryForMock).toHaveBeenCalledWith("tv", 100);
    expect(screen.getByText("Test Movie")).toBeInTheDocument();
  });

  it("clears everything only after the inline confirmation", async () => {
    fetchHistoryMock.mockResolvedValue([movieRow]);
    clearHistoryMock.mockImplementation(() => {
      fetchHistoryMock.mockResolvedValue([]);
      return Promise.resolve();
    });

    renderWithProviders(<History />, { user: testUser });
    expect(await screen.findByText("Test Movie")).toBeInTheDocument();

    // Cancel keeps the list untouched.
    fireEvent.click(screen.getByRole("button", { name: "Clear history" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(clearHistoryMock).not.toHaveBeenCalled();
    expect(screen.getByText("Test Movie")).toBeInTheDocument();

    // Confirm empties it.
    fireEvent.click(screen.getByRole("button", { name: "Clear history" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(screen.queryByText("Test Movie")).not.toBeInTheDocument(),
    );
    expect(clearHistoryMock).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state without fetching when signed out", async () => {
    renderWithProviders(<History />);

    expect(
      await screen.findByText(/Nothing in your Watch History list yet/),
    ).toBeInTheDocument();
    expect(fetchHistoryMock).not.toHaveBeenCalled();
  });
});
