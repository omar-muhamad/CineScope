import { render } from "@testing-library/react";
import GridLayout from "@/components/layout/GridLayout";

describe("GridLayout", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <GridLayout>
        <div />
      </GridLayout>,
    );
    expect(container).toBeDefined();
  });

  it("renders the correct number of children", () => {
    const { getAllByRole } = render(
      <GridLayout>
        <li>Child 1</li>
        <li>Child 2</li>
        <li>Child 3</li>
      </GridLayout>,
    );
    expect(getAllByRole("listitem").length).toBe(3);
  });

  it("applies responsive grid classes correctly", () => {
    const { container } = render(
      <GridLayout>
        <div />
      </GridLayout>,
    );
    expect(container.firstChild).toHaveClass(
      "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
    );
  });
});
