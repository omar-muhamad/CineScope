import { fireEvent, screen, waitFor } from "@testing-library/react";

import ContinueWatchingSection from "@/pages/Home/components/ContinueWatchingSection";
import type { HistoryRow } from "@/api/history";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const { fetchHistoryMock, fetchDetailsMock } = vi.hoisted(() => ({
  fetchHistoryMock: vi.fn(),
  fetchDetailsMock: vi.fn(),
}));

vi.mock("@/api/history", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/history")>();
  return { ...actual, fetchHistory: fetchHistoryMock };
});

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return { ...actual, fetchDetails: fetchDetailsMock };
});

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

beforeEach(() => {
  fetchHistoryMock.mockReset().mockResolvedValue([]);
  fetchDetailsMock
    .mockReset()
    .mockResolvedValue({ backdrop_path: "/backdrop.jpg" });
});

describe("ContinueWatchingSection", () => {
  it("shows the newest title as the active banner with its latest episode", async () => {
    // Newest-first rows: the show's S2E2 must win over its older S1E3 row,
    // and both rows must collapse into a single slide.
    fetchHistoryMock.mockResolvedValue([
      historyRow({ season: 2, episode: 2 }),
      historyRow({ season: 1, episode: 3 }),
      historyRow({
        mediaId: 200,
        mediaType: "movie",
        season: 0,
        episode: 0,
        title: "Test Movie",
      }),
    ]);

    renderWithProviders(<ContinueWatchingSection />, { user: testUser });

    expect(await screen.findByText("Continue Watching")).toBeInTheDocument();
    expect(screen.getByText("S2 · E2")).toBeInTheDocument();
    // Only the active slide is exposed to the accessibility tree.
    expect(screen.getByRole("link", { name: /test show/i })).toHaveAttribute(
      "href",
      "/watch/tv/100",
    );
    expect(
      screen.queryByRole("link", { name: /test movie/i }),
    ).not.toBeInTheDocument();
    // One dot per deduped title.
    expect(
      screen.getAllByRole("button", { name: /go to slide/i }),
    ).toHaveLength(2);
  });

  it("steps to the next slide on Next, wrapping at the end", async () => {
    fetchHistoryMock.mockResolvedValue([
      historyRow({ season: 2, episode: 2 }),
      historyRow({
        mediaId: 200,
        mediaType: "movie",
        season: 0,
        episode: 0,
        title: "Test Movie",
      }),
    ]);

    renderWithProviders(<ContinueWatchingSection />, { user: testUser });
    await screen.findByText("Continue Watching");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("link", { name: /test movie/i })).toHaveAttribute(
      "href",
      "/watch/movie/200",
    );
    expect(
      screen.queryByRole("link", { name: /test show/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByRole("link", { name: /test show/i }),
    ).toBeInTheDocument();
  });

  it("shows no episode label or slide controls for a single sentinel title", async () => {
    fetchHistoryMock.mockResolvedValue([
      historyRow({
        mediaId: 200,
        mediaType: "movie",
        season: 0,
        episode: 0,
        title: "Test Movie",
      }),
    ]);

    renderWithProviders(<ContinueWatchingSection />, { user: testUser });

    expect(await screen.findByText("Test Movie")).toBeInTheDocument();
    expect(screen.queryByText(/S0/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
  });

  it("caps the banner at five titles", async () => {
    fetchHistoryMock.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) =>
        historyRow({
          mediaId: 200 + i,
          mediaType: "movie",
          season: 0,
          episode: 0,
          title: `Movie ${i}`,
        }),
      ),
    );

    renderWithProviders(<ContinueWatchingSection />, { user: testUser });

    await screen.findByText("Continue Watching");
    expect(
      screen.getAllByRole("button", { name: /go to slide/i }),
    ).toHaveLength(5);
  });

  it("renders nothing once an empty history settles", async () => {
    const { container } = renderWithProviders(<ContinueWatchingSection />, {
      user: testUser,
    });

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing and skips the fetch when signed out", () => {
    const { container } = renderWithProviders(<ContinueWatchingSection />);

    expect(container).toBeEmptyDOMElement();
    expect(fetchHistoryMock).not.toHaveBeenCalled();
  });
});
