import { fireEvent, screen } from "@testing-library/react";

import Movies from "@/pages/Movies";
import { renderWithProviders } from "@/tests/test-utils";

const moviePage = (id: number, title: string) => ({
  page: 1,
  total_pages: 5,
  results: [
    {
      id,
      media_type: "movie",
      backdrop_path: "b",
      poster_path: "p",
      release_date: "2024-01-01",
      first_air_date: "",
      adult: false,
      vote_average: 8,
      title,
      name: "",
    },
  ],
});

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return {
    ...actual,
    // The factories run lazily (per call), so referencing moviePage is safe
    // even though vi.mock itself is hoisted above its declaration.
    fetchMediaList: vi.fn(() => Promise.resolve(moviePage(1, "Popular Movie"))),
    fetchDiscover: vi.fn(() => Promise.resolve(moviePage(2, "Filtered Movie"))),
    fetchGenres: vi.fn(() => Promise.resolve([{ id: 28, name: "Action" }])),
  };
});

describe("Movies Page", () => {
  it("renders the popular heading and fetched movies by default", async () => {
    renderWithProviders(<Movies />);
    // Heading lives inside PageLayout's children, shown only after load.
    expect(await screen.findByText("Popular Movie")).toBeInTheDocument();
    expect(screen.getByText("Popular Movies")).toBeInTheDocument();
  });

  it("renders the heading for the category passed as a prop", async () => {
    renderWithProviders(<Movies category="trending" />);
    expect(await screen.findByText("Popular Movie")).toBeInTheDocument();
    expect(screen.getByText("Trending Movies")).toBeInTheDocument();
  });

  it("switches to filtered results when a filter is applied", async () => {
    renderWithProviders(<Movies />);
    expect(await screen.findByText("Popular Movie")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filter by rating"), {
      target: { value: "7" },
    });

    expect(await screen.findByText("Filtered Movie")).toBeInTheDocument();
    // Clearing the filters goes back to the unfiltered category list.
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(await screen.findByText("Popular Movie")).toBeInTheDocument();
  });

  it("reads filters from the URL query params", async () => {
    renderWithProviders(<Movies />, { route: "/movies/popular?rating=7" });
    expect(await screen.findByText("Filtered Movie")).toBeInTheDocument();
  });

  it("cycles the year sort toggle through desc, asc, and off", async () => {
    renderWithProviders(<Movies />);
    expect(await screen.findByText("Popular Movie")).toBeInTheDocument();
    const toggle = screen.getByRole("button", {
      name: /sort by release year/i,
    });

    // off → desc: sorted results come from the discover endpoint. The title
    // reflects the committed state, so waiting on it keeps the clicks from
    // racing the transition.
    fireEvent.click(toggle);
    await screen.findByTitle("Sorted: newest first");
    expect(await screen.findByText("Filtered Movie")).toBeInTheDocument();

    // desc → asc: still discover-backed.
    fireEvent.click(toggle);
    await screen.findByTitle("Sorted: oldest first");
    expect(screen.getByText("Filtered Movie")).toBeInTheDocument();

    // asc → off: back to the plain category list.
    fireEvent.click(toggle);
    expect(await screen.findByText("Popular Movie")).toBeInTheDocument();
  });
});
