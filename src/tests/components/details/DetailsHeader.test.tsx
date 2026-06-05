import { render, screen } from "@testing-library/react";
import DetailsHeader from "@/components/details/DetailsHeader";

import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { MemoryRouter } from "react-router-dom";

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
    overview: "Test overview",
  };

  it("renders correctly with given props", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <DetailsHeader {...defaultProps} />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByTestId("details-poster-image")).toBeInTheDocument();
    expect(screen.getByTestId("details-rating")).toBeInTheDocument();
  });
});
