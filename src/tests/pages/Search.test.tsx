import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import Search from "@/pages/Search";
import { store } from "@/redux/store";

describe("Search Page", () => {
  it("shows a prompt when there is no search query", () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/search"]}>
          <Search />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText(/find movies and tv shows/i)).toBeInTheDocument();
  });

  it("renders search results when a query is present", () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/search?search=batman"]}>
          <Search />
        </MemoryRouter>
      </Provider>,
    );
    // The prompt is replaced once a query is in the URL.
    expect(
      screen.queryByText(/find movies and tv shows/i),
    ).not.toBeInTheDocument();
  });
});
