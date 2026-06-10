import { fireEvent, screen, waitFor } from "@testing-library/react";

import Favorites from "@/pages/Favorites";
import type { MediaItem } from "@/types";
import { renderWithProviders, testSession } from "@/tests/test-utils";

const { fetchFavoritesMock, fetchWatchlistMock, removeSavedMock } = vi.hoisted(
  () => ({
    fetchFavoritesMock: vi.fn(),
    fetchWatchlistMock: vi.fn(),
    removeSavedMock: vi.fn(),
  }),
);

vi.mock("@/api/saved", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/saved")>();
  return {
    ...actual,
    fetchFavorites: fetchFavoritesMock,
    fetchWatchlist: fetchWatchlistMock,
    removeSaved: removeSavedMock,
  };
});

const favMovie: MediaItem = {
  id: 10,
  media_type: "movie",
  title: "Fav Movie",
  poster_path: "p",
  release_date: "2024-01-01",
  vote_average: 7,
};

beforeEach(() => {
  fetchFavoritesMock.mockReset();
  fetchWatchlistMock.mockReset();
  removeSavedMock.mockReset();
  fetchWatchlistMock.mockResolvedValue([]);
});

describe("Favorites Page", () => {
  it("renders the signed-in user's favorites", async () => {
    fetchFavoritesMock.mockResolvedValue([favMovie]);

    renderWithProviders(<Favorites />, { session: testSession });
    expect(await screen.findByText("Fav Movie")).toBeInTheDocument();
  });

  it("removes a title from the list when its favorite toggle is turned off", async () => {
    // Mock server mirrors the removal so the post-toggle refetch agrees.
    let favorites: MediaItem[] = [favMovie];
    fetchFavoritesMock.mockImplementation(() =>
      Promise.resolve([...favorites]),
    );
    removeSavedMock.mockImplementation(
      (_listType, _mediaType, mediaId: number) => {
        favorites = favorites.filter((item) => item.id !== mediaId);
        return Promise.resolve();
      },
    );

    renderWithProviders(<Favorites />, { session: testSession });

    expect(await screen.findByText("Fav Movie")).toBeInTheDocument();
    // The card's favorite toggle reflects the favorited state ("Remove …").
    fireEvent.click(await screen.findByLabelText("Remove from bookmarks"));

    // Optimistically removed from the list, and the refetch keeps it gone.
    await waitFor(() =>
      expect(screen.queryByText("Fav Movie")).not.toBeInTheDocument(),
    );
    expect(removeSavedMock).toHaveBeenCalledWith("favorite", "movie", 10);
  });
});
