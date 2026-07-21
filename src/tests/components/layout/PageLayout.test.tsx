import { screen } from "@testing-library/react";

import PageLayout from "@/components/layout/PageLayout";
import { renderWithProviders } from "@/tests/test-utils";

describe("PageLayout", () => {
  it("renders loading state correctly", () => {
    renderWithProviders(
      <PageLayout loading={true}>
        <div>Test Child</div>
      </PageLayout>,
    );
    expect(screen.getByTestId("loading-component")).toBeInTheDocument();
  });

  it("renders children when not loading", () => {
    renderWithProviders(
      <PageLayout loading={false}>
        <div>Test Child</div>
      </PageLayout>,
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });
});
