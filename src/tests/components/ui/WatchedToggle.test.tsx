import { fireEvent, screen, waitFor } from "@testing-library/react";

import WatchedToggle from "@/components/ui/WatchedToggle";
import type { HistoryRow } from "@/api/history";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const { fetchHistoryMock, recordWatchMock, removeHistoryForMock } = vi.hoisted(
  () => ({
    fetchHistoryMock: vi.fn(),
    recordWatchMock: vi.fn(),
    removeHistoryForMock: vi.fn(),
  }),
);

vi.mock("@/api/history", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/history")>();
  return {
    ...actual,
    fetchHistory: fetchHistoryMock,
    recordWatch: recordWatchMock,
    removeHistoryFor: removeHistoryForMock,
  };
});

const watchedRow: HistoryRow = {
  mediaId: 7,
  mediaType: "movie",
  season: 0,
  episode: 0,
  title: "Seen It",
  posterPath: "p",
  releaseDate: "2024-01-01",
  voteAverage: 7,
  watchedAt: "2026-07-20T10:00:00Z",
};

beforeEach(() => {
  fetchHistoryMock.mockReset().mockResolvedValue([]);
  recordWatchMock.mockReset().mockResolvedValue(undefined);
  removeHistoryForMock.mockReset().mockResolvedValue(undefined);
});

describe("WatchedToggle", () => {
  it("marks an unwatched title with the (0,0) sentinel", async () => {
    // Mock server mirrors the write so the post-mutation refetch agrees.
    let rows: HistoryRow[] = [];
    fetchHistoryMock.mockImplementation(() => Promise.resolve([...rows]));
    recordWatchMock.mockImplementation(() => {
      rows = [watchedRow];
      return Promise.resolve();
    });

    renderWithProviders(
      <WatchedToggle id={7} media_type="movie" meta={{ title: "Seen It" }} />,
      { user: testUser },
    );

    const button = screen.getByLabelText("Mark as watched");
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);

    await waitFor(() => expect(recordWatchMock).toHaveBeenCalled());
    // react-query passes (variables, context) — assert on the variables.
    expect(recordWatchMock.mock.calls[0][0]).toMatchObject({
      mediaType: "movie",
      mediaId: 7,
    });
    expect(
      await screen.findByLabelText("Remove from watch history"),
    ).toBeInTheDocument();
  });

  it("unmarks a watched title by clearing all its rows", async () => {
    fetchHistoryMock.mockResolvedValue([watchedRow]);

    renderWithProviders(
      <WatchedToggle id={7} media_type="movie" meta={{ title: "Seen It" }} />,
      { user: testUser },
    );

    const button = await screen.findByLabelText("Remove from watch history");
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);

    await waitFor(() =>
      expect(removeHistoryForMock).toHaveBeenCalledWith("movie", 7),
    );
  });

  it("renders the disabled tooltip branch when signed out", () => {
    renderWithProviders(<WatchedToggle id={7} media_type="movie" />);

    expect(
      screen.getByLabelText("Log in to track watched titles"),
    ).toBeInTheDocument();
    expect(fetchHistoryMock).not.toHaveBeenCalled();
  });
});
