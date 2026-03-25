import { render, screen, fireEvent } from "@testing-library/react";
import TrailerButton from "@/components/details/PlayButton";

describe("TrailerButton", () => {
  it("renders correctly", () => {
    const mockOnClick = vi.fn();
    render(<TrailerButton onClick={mockOnClick} />);
    const button = screen.getByRole("button", { name: /trailer/i });
    expect(button).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const mockOnClick = vi.fn();
    render(<TrailerButton onClick={mockOnClick} />);
    const button = screen.getByRole("button", { name: /trailer/i });
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
