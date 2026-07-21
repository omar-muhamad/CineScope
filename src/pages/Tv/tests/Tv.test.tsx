import { fireEvent, screen } from "@testing-library/react";

import Tv from "@/pages/Tv";
import { renderWithProviders } from "@/tests/test-utils";

const tvPage = (id: number, name: string) => ({
  page: 1,
  total_pages: 5,
  results: [
    {
      id,
      media_type: "tv",
      backdrop_path: "b",
      poster_path: "p",
      release_date: "",
      first_air_date: "2024-01-01",
      adult: false,
      vote_average: 8,
      title: "",
      name,
    },
  ],
});

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    // The factories run lazily (per call), so referencing tvPage is safe even
    // though vi.mock itself is hoisted above its declaration.
    fetchMediaList: vi.fn(() => Promise.resolve(tvPage(1, "Popular Show"))),
    fetchDiscover: vi.fn(() => Promise.resolve(tvPage(2, "Filtered Show"))),
    fetchGenres: vi.fn(() => Promise.resolve([{ id: 18, name: "Drama" }])),
  };
});

describe("Tv Page", () => {
  it("renders the popular heading and fetched shows by default", async () => {
    renderWithProviders(<Tv />);
    // Heading lives inside PageLayout's children, shown only after load.
    expect(await screen.findByText("Popular Show")).toBeInTheDocument();
    expect(screen.getByText("Popular TV Shows")).toBeInTheDocument();
  });

  it("renders the heading for the category passed as a prop", async () => {
    renderWithProviders(<Tv category="on_the_air" />);
    expect(await screen.findByText("Popular Show")).toBeInTheDocument();
    expect(screen.getByText("On TV")).toBeInTheDocument();
  });

  it("switches to filtered results when a filter is applied", async () => {
    renderWithProviders(<Tv />);
    expect(await screen.findByText("Popular Show")).toBeInTheDocument();

    // Genre options arrive from their own (non-suspending) query, so wait
    // for the Drama row after opening the menu.
    fireEvent.click(screen.getByRole("button", { name: "Filter by genre" }));
    fireEvent.click(await screen.findByRole("option", { name: "Drama" }));

    expect(await screen.findByText("Filtered Show")).toBeInTheDocument();
  });
});
