import { fireEvent, screen, waitFor } from "@testing-library/react";

import Favorites from "@/pages/Favorites";
import type { MediaItem } from "@/types";
import {
  googleUser,
  renderWithProviders,
  tmdbAccount,
} from "@/tests/test-utils";

const { fetchFavoritesMock, getAccountStatesMock, setFavoriteMock } =
  vi.hoisted(() => ({
    fetchFavoritesMock: vi.fn(),
    getAccountStatesMock: vi.fn(),
    setFavoriteMock: vi.fn(),
  }));

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    fetchFavorites: fetchFavoritesMock,
    getAccountStates: getAccountStatesMock,
    setFavorite: setFavoriteMock,
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
  getAccountStatesMock.mockReset();
  setFavoriteMock.mockReset();
});

describe("Favorites Page", () => {
  it("renders the signed-in user's favorites", async () => {
    fetchFavoritesMock.mockResolvedValue([favMovie]);
    getAccountStatesMock.mockResolvedValue({
      favorite: true,
      watchlist: false,
    });

    renderWithProviders(<Favorites />, {
      auth: { google: googleUser, tmdb: tmdbAccount },
    });
    expect(await screen.findByText("Fav Movie")).toBeInTheDocument();
  });

  it("removes a title from the list when its favorite toggle is turned off", async () => {
    // Mock server mirrors the removal so the post-toggle refetch agrees.
    let favorites: MediaItem[] = [favMovie];
    fetchFavoritesMock.mockImplementation(() =>
      Promise.resolve([...favorites]),
    );
    getAccountStatesMock.mockImplementation((_m, id: number) =>
      Promise.resolve({
        favorite: favorites.some((item) => item.id === id),
        watchlist: false,
      }),
    );
    setFavoriteMock.mockImplementation(
      (_a, _s, _m, mediaId: number, favorite: boolean) => {
        if (!favorite) {
          favorites = favorites.filter((item) => item.id !== mediaId);
        }
        return Promise.resolve({});
      },
    );

    renderWithProviders(<Favorites />, {
      auth: { google: googleUser, tmdb: tmdbAccount },
    });

    expect(await screen.findByText("Fav Movie")).toBeInTheDocument();
    // The card's favorite toggle reflects the favorited state ("Remove …").
    fireEvent.click(await screen.findByLabelText("Remove from bookmarks"));

    // Optimistically removed from the list, and the refetch keeps it gone.
    await waitFor(() =>
      expect(screen.queryByText("Fav Movie")).not.toBeInTheDocument(),
    );
    expect(setFavoriteMock).toHaveBeenCalledWith(
      tmdbAccount.account_id,
      tmdbAccount.session_id,
      "movie",
      10,
      false,
    );
  });
});
