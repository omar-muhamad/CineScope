import Loading from "@/components/common/Loading";
import { render, screen } from "@testing-library/react";

describe("Loading component", () => {
  it("renders main container", () => {
    render(<Loading />);
    const mainElement = screen.getByTestId("loading-component");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass(
      "h-[calc(100vh-12rem)] md:h-full w-full flex justify-center items-center md:pr-6"
    );
  });
});
