import { screen } from "@testing-library/react";

import TrendingCard from "@/pages/Home/components/TrendingCard";
import { renderWithProviders } from "@/tests/test-utils";

describe("TrendingCard", () => {
  const baseProps = {
    id: 1,
    imgSrc: "test.jpg",
    releaseDate: "2023-01-01",
    media_type: "movie",
    rating: 8.5,
    title: "Test Movie",
  };

  it("renders without crashing", () => {
    renderWithProviders(<TrendingCard {...baseProps} />);
    expect(screen.getByAltText("Test Movie poster")).toBeInTheDocument();
  });

  it("renders correct link for a movie", () => {
    renderWithProviders(<TrendingCard {...baseProps} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/movie/1");
  });

  it("renders correct link for a TV show", () => {
    renderWithProviders(
      <TrendingCard {...{ ...baseProps, media_type: "tv" }} />,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tv/1");
  });
});
