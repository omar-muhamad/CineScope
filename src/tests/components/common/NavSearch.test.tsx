import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NavSearch from "@/components/common/NavSearch";
import { renderWithProviders } from "@/tests/test-utils";
import { searchMulti } from "@/api/tmdb";
import type { MediaSummary, Paginated } from "@/types";

vi.mock("@/api/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tmdb")>();
  return { ...actual, searchMulti: vi.fn() };
});

const media = (overrides: Partial<MediaSummary>): MediaSummary => ({
  id: 1,
  media_type: "movie",
  backdrop_path: "b",
  poster_path: "/p.jpg",
  release_date: "2021-01-01",
  first_air_date: "",
  adult: false,
  vote_average: 7,
  title: "",
  name: "",
  genre_ids: [],
  ...overrides,
});

const pageOf = (results: MediaSummary[]): Paginated<MediaSummary> => ({
  page: 1,
  results,
  total_pages: 1,
});

const seedResults = () =>
  vi.mocked(searchMulti).mockResolvedValue(
    pageOf([
      media({ id: 1, media_type: "movie", title: "Batman" }),
      media({
        id: 2,
        media_type: "tv",
        name: "Batman: The Animated Series",
        release_date: "",
        first_air_date: "1992-09-05",
      }),
      // People come back from search/multi but must never be suggested.
      media({ id: 3, media_type: "person", name: "Christian Bale" }),
    ]),
  );

describe("NavSearch", () => {
  // The config-level mock reset only covers vi.spyOn spies — clear the module
  // mock's call history explicitly so counts never leak between tests.
  beforeEach(() => {
    vi.mocked(searchMulti).mockReset();
  });

  it("renders an empty search input on initial render", () => {
    renderWithProviders(<NavSearch />);
    expect(screen.getByPlaceholderText("Search...")).toHaveValue("");
  });

  it("updates the input field when text is entered", async () => {
    seedResults();
    renderWithProviders(<NavSearch />);
    const input = screen.getByPlaceholderText("Search...");
    await userEvent.setup().type(input, "test");
    expect(input).toHaveValue("test");
  });

  it("shows loading skeletons, then movie and TV suggestions with posters", async () => {
    seedResults();
    renderWithProviders(<NavSearch />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Search..."), "batman");
    expect(
      screen.getByTestId("search-suggestions-loading"),
    ).toBeInTheDocument();

    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("Batman");
    expect(options[0]).toHaveAttribute("href", "/movie/1");
    expect(options[1]).toHaveTextContent("Batman: The Animated Series");
    expect(options[1]).toHaveAttribute("href", "/tv/2");
    expect(screen.queryByText("Christian Bale")).not.toBeInTheDocument();
    expect(screen.getByAltText("Batman poster")).toBeInTheDocument();
  });

  it("debounces typing into a single request for the final query", async () => {
    seedResults();
    renderWithProviders(<NavSearch />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Search..."), "batman");
    await screen.findAllByRole("option");
    expect(searchMulti).toHaveBeenCalledTimes(1);
    expect(searchMulti).toHaveBeenCalledWith("batman", 1);
  });

  it("does not fetch suggestions below the minimum query length", async () => {
    seedResults();
    renderWithProviders(<NavSearch />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Search..."), "ba");
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(searchMulti).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    vi.mocked(searchMulti).mockResolvedValue(pageOf([]));
    renderWithProviders(<NavSearch />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Search..."), "zzzz");
    expect(await screen.findByText(/no results for/i)).toBeInTheDocument();
  });

  it("closes the dropdown on Escape and reopens on focus", async () => {
    seedResults();
    renderWithProviders(<NavSearch />);
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText("Search...");

    await user.type(input, "batman");
    await screen.findAllByRole("option");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(input);
    expect(await screen.findAllByRole("option")).toHaveLength(2);
  });

  it("navigates the active option with arrow keys and Enter", async () => {
    seedResults();
    renderWithProviders(<NavSearch />);
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText("Search...");

    await user.type(input, "batman");
    await screen.findAllByRole("option");

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      expect.stringContaining("option-1"),
    );
    expect(screen.getAllByRole("option")[1]).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
  });

  it("submits to the search page without an active option", async () => {
    seedResults();
    const onSearch = vi.fn();
    renderWithProviders(<NavSearch onSearch={onSearch} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Search..."), "batman");
    await screen.findAllByRole("option");

    await user.keyboard("{Enter}");
    expect(onSearch).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
  });
});
