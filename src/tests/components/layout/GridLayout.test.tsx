import { render } from "@testing-library/react";
import GridLayout from "@/components/layout/GridLayout";

describe("GridLayout", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <GridLayout>
        <div />
      </GridLayout>
    );
    expect(container).toBeDefined();
  });

  it("renders the correct number of children", () => {
    const { getAllByRole } = render(
      <GridLayout>
        <li>Child 1</li>
        <li>Child 2</li>
        <li>Child 3</li>
      </GridLayout>
    );
    expect(getAllByRole("listitem").length).toBe(3);
  });

  it("applies responsive grid classes correctly", () => {
    const { container } = render(
      <GridLayout>
        <div />
      </GridLayout>
    );
    expect(container.firstChild).toHaveClass(
      "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    );
  });
});
