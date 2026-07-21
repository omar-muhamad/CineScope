import { render, screen } from "@testing-library/react";
import TrendingWrapper from "@/pages/Home/components/TrendingCarousel";

describe("TrendingWrapper", () => {
  it("renders without crashing", () => {
    render(
      <TrendingWrapper>
        <div>Test Child</div>
      </TrendingWrapper>,
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("renders its children properly", () => {
    render(
      <TrendingWrapper>
        <button>Click Me</button>
      </TrendingWrapper>,
    );
    expect(
      screen.getByRole("button", { name: "Click Me" }),
    ).toBeInTheDocument();
  });

  it("applies correct class names for styling", () => {
    render(
      <TrendingWrapper>
        <div>Styling Test</div>
      </TrendingWrapper>,
    );
    const list = screen.getByText("Styling Test").parentNode;
    expect(list).toHaveClass(
      "flex gap-4 overflow-x-scroll scroll-smooth scrollbar-none",
    );
    expect(list?.parentNode).toHaveClass("relative w-full mt-6");
  });

  it("renders previous and next carousel controls", () => {
    render(
      <TrendingWrapper>
        <div>Styling Test</div>
      </TrendingWrapper>,
    );
    expect(
      screen.getByRole("button", { name: "Previous" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });
});
