import SearchBox from "@/components/common/SearchBox";
import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import userEvent from "@testing-library/user-event";

describe("SearchBox", () => {
  it("renders correctly", () => {
    const { container } = render(
      <Router>
        <SearchBox />
      </Router>
    );
    expect(container).toMatchSnapshot();
  });

  it("has a search input field", () => {
    render(
      <Router>
        <SearchBox />
      </Router>
    );
    const input = screen.getByPlaceholderText(
      "Search for movies and TV series..."
    );
    expect(input).toBeInTheDocument();
  });

  it("has an empty input field on initial render", () => {
    render(
      <Router>
        <SearchBox />
      </Router>
    );
    const input = screen.getByPlaceholderText(
      "Search for movies and TV series..."
    );
    expect(input).toHaveValue("");
  });
  
  it("updates input field when text is entered", async() => {
    render(
      <Router>
        <SearchBox />
      </Router>
    );
    const input = screen.getByPlaceholderText(
      "Search for movies and TV series..."
    );
    const user = userEvent.setup();
    await user.type(input, "test");
    expect(input).toHaveValue("test");
  });
});
