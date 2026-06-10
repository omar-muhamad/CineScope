import { fireEvent, screen, waitFor } from "@testing-library/react";

import SaveToggle from "@/components/ui/SaveToggle";
import {
  googleUser,
  renderWithProviders,
  tmdbAccount,
} from "@/tests/test-utils";

const { getAccountStatesMock, setFavoriteMock } = vi.hoisted(() => ({
  getAccountStatesMock: vi.fn(),
  setFavoriteMock: vi.fn(),
}));

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    getAccountStates: getAccountStatesMock,
    setFavorite: setFavoriteMock,
  };
});

const renderToggle = () =>
  renderWithProviders(
    <SaveToggle id={1} media_type="movie" kind="favorite" />,
    {
      auth: { google: googleUser, tmdb: tmdbAccount },
    },
  );

beforeEach(() => {
  getAccountStatesMock.mockReset();
  setFavoriteMock.mockReset();
});

describe("SaveToggle", () => {
  it("optimistically marks the title as favorited and persists on success", async () => {
    // The mock server mirrors whatever setFavorite writes.
    let serverFavorite = false;
    getAccountStatesMock.mockImplementation(() =>
      Promise.resolve({ favorite: serverFavorite, watchlist: false }),
    );
    setFavoriteMock.mockImplementation((_a, _s, _m, _id, favorite: boolean) => {
      serverFavorite = favorite;
      return Promise.resolve({});
    });

    renderToggle();
    const button = await screen.findByRole("button");
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-pressed", "false"),
    );

    fireEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));
    expect(setFavoriteMock).toHaveBeenCalledWith(
      tmdbAccount.account_id,
      tmdbAccount.session_id,
      "movie",
      1,
      true,
    );
  });

  it("rolls back when the toggle request fails", async () => {
    getAccountStatesMock.mockResolvedValue({
      favorite: false,
      watchlist: false,
    });
    setFavoriteMock.mockRejectedValue(new Error("network down"));

    renderToggle();
    const button = await screen.findByRole("button");
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-pressed", "false"),
    );

    fireEvent.click(button);

    await waitFor(() => expect(setFavoriteMock).toHaveBeenCalled());
    // After the failed write settles, the optimistic flip is reverted.
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-pressed", "false"),
    );
  });
});
