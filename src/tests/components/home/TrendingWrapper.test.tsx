import { render, screen } from "@testing-library/react";
import TrendingWrapper from "@/components/home/TrendingWrapper";

describe("TrendingWrapper", () => {
  it("renders without crashing", () => {
    render(
      <TrendingWrapper>
        <div>Test Child</div>
      </TrendingWrapper>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("renders its children properly", () => {
    render(
      <TrendingWrapper>
        <button>Click Me</button>
      </TrendingWrapper>
    );
    expect(
      screen.getByRole("button", { name: "Click Me" })
    ).toBeInTheDocument();
  });

  it("applies correct class names for styling", () => {
    render(
      <TrendingWrapper>
        <div>Styling Test</div>
      </TrendingWrapper>
    );
    const wrapperDiv = screen.getByText("Styling Test").parentNode?.parentNode;
    expect(wrapperDiv).toHaveClass(
      "w-full overflow-x-scroll no-scrollbar mt-6"
    );
    expect(wrapperDiv?.firstChild).toHaveClass(
      "carousel flex gap-6 animate-slide"
    );
  });
});
