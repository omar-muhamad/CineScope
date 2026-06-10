import { screen } from "@testing-library/react";

import Favorites from "@/pages/Favorites";
import {
  googleUser,
  renderWithProviders,
  tmdbAccount,
} from "@/tests/test-utils";

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    fetchFavorites: vi.fn(() =>
      Promise.resolve([
        {
          id: 10,
          media_type: "movie",
          title: "Fav Movie",
          poster_path: "p",
          release_date: "2024-01-01",
          vote_average: 7,
        },
      ]),
    ),
  };
});

describe("Favorites Page", () => {
  it("renders the signed-in user's favorites", async () => {
    renderWithProviders(<Favorites />, {
      auth: { google: googleUser, tmdb: tmdbAccount },
    });
    expect(await screen.findByText("Fav Movie")).toBeInTheDocument();
  });
});
