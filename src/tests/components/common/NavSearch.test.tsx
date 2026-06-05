import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import userEvent from "@testing-library/user-event";

import NavSearch from "@/components/common/NavSearch";

describe("NavSearch", () => {
  it("renders a search input", () => {
    render(
      <Router>
        <NavSearch />
      </Router>,
    );
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeInTheDocument();
  });

  it("has an empty input field on initial render", () => {
    render(
      <Router>
        <NavSearch />
      </Router>,
    );
    expect(screen.getByPlaceholderText("Search...")).toHaveValue("");
  });

  it("updates the input field when text is entered", async () => {
    render(
      <Router>
        <NavSearch />
      </Router>,
    );
    const input = screen.getByPlaceholderText("Search...");
    const user = userEvent.setup();
    await user.type(input, "test");
    expect(input).toHaveValue("test");
  });
});
