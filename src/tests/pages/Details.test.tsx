import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";

import Details from "@/pages/Details";
import { renderWithProviders } from "@/tests/test-utils";

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    fetchDetails: vi.fn(() =>
      Promise.resolve({
        id: 1,
        title: "Mock Movie",
        name: "",
        genres: [{ id: 1, name: "Action" }],
        vote_average: 8,
        overview: "An overview",
        backdrop_path: "b",
        poster_path: "p",
        release_date: "2024-01-01",
        first_air_date: "",
      }),
    ),
    fetchRecommendations: vi.fn(() => Promise.resolve([])),
  };
});

describe("Details Page", () => {
  it("renders the fetched title in the header", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/:media_type/:id" element={<Details />} />
      </Routes>,
      { route: "/movie/1" },
    );
    expect(await screen.findByText("Mock Movie")).toBeInTheDocument();
  });
});
