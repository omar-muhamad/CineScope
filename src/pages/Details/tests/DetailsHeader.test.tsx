import { screen } from "@testing-library/react";

import DetailsHeader from "@/pages/Details/components/DetailsHeader";
import { renderWithProviders } from "@/tests/test-utils";

describe("DetailsHeader", () => {
  const defaultProps = {
    id: 1,
    title: "Test Movie",
    rating: 8.5,
    release_date: "2022-01-01",
    media_type: "movie",
    imageSrc: "testImageSrc.jpg",
    genres: [
      { id: 1, name: "Action" },
      { id: 2, name: "Adventure" },
    ],
    posterUrl: "testPosterUrl.jpg",
    trailerKey: "dQw4w9WgXcQ",
    overview: "Test overview",
  };

  it("renders correctly with given props", () => {
    renderWithProviders(<DetailsHeader {...defaultProps} />);
    expect(screen.getByTestId("details-poster-image")).toBeInTheDocument();
    expect(screen.getByTestId("details-rating")).toBeInTheDocument();
  });
});
