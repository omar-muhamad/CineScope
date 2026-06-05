import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TrendingCard from "@/components/home/TrendingCard";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

describe("TrendingCard", () => {
  const baseProps = {
    id: 1,
    imgSrc: "test.jpg",
    releaseDate: "2023-01-01",
    media_type: "movie",
    ratings: "PG",
    title: "Test Movie",
  };

  it("renders without crashing", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <TrendingCard {...baseProps} />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByAltText("Test Movie poster")).toBeInTheDocument();
  });

  it("renders correct link for a movie", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <TrendingCard {...baseProps} />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/movie/1");
  });

  it("renders correct link for a TV show", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <TrendingCard {...{ ...baseProps, media_type: "tv" }} />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tv/1");
  });
});
