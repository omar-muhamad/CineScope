import { fireEvent, screen, waitFor } from "@testing-library/react";

import SaveToggle from "@/components/ui/SaveToggle";
import type { MediaItem } from "@/types";
import { renderWithProviders, testSession } from "@/tests/test-utils";

const { fetchFavoritesMock, fetchWatchlistMock, addSavedMock } = vi.hoisted(
  () => ({
    fetchFavoritesMock: vi.fn(),
    fetchWatchlistMock: vi.fn(),
    addSavedMock: vi.fn(),
  }),
);

vi.mock("@/api/saved", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/saved")>();
  return {
    ...actual,
    fetchFavorites: fetchFavoritesMock,
    fetchWatchlist: fetchWatchlistMock,
    addSaved: addSavedMock,
  };
});

const meta = {
  title: "Fav",
  poster_path: "p",
  release_date: "2024",
  vote_average: 7,
};

const renderToggle = () =>
  renderWithProviders(
    <SaveToggle id={1} media_type="movie" kind="favorite" meta={meta} />,
    { session: testSession },
  );

beforeEach(() => {
  fetchFavoritesMock.mockReset();
  fetchWatchlistMock.mockReset();
  addSavedMock.mockReset();
  fetchWatchlistMock.mockResolvedValue([]);
});

describe("SaveToggle", () => {
  it("optimistically marks the title as favorited and persists on success", async () => {
    // The mock server mirrors whatever addSaved writes.
    let favorites: MediaItem[] = [];
    fetchFavoritesMock.mockImplementation(() =>
      Promise.resolve([...favorites]),
    );
    addSavedMock.mockImplementation((_listType, _mediaType, id: number) => {
      favorites = [{ id, media_type: "movie", title: "Fav" }];
      return Promise.resolve();
    });

    renderToggle();
    const button = await screen.findByRole("button");
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-pressed", "false"),
    );

    fireEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));
    expect(addSavedMock).toHaveBeenCalledWith(
      "favorite",
      "movie",
      1,
      expect.objectContaining({ title: "Fav" }),
    );
  });

  it("rolls back when the toggle request fails", async () => {
    fetchFavoritesMock.mockResolvedValue([]);
    addSavedMock.mockRejectedValue(new Error("network down"));

    renderToggle();
    const button = await screen.findByRole("button");
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-pressed", "false"),
    );

    fireEvent.click(button);

    await waitFor(() => expect(addSavedMock).toHaveBeenCalled());
    // After the failed write settles, the optimistic flip is reverted.
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-pressed", "false"),
    );
  });
});
