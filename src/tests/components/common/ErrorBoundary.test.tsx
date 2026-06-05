import ErrorBoundary from "@/components/common/ErrorBoundary";
import { render, screen } from "@testing-library/react";

const ProblematicChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Child component</div>;
};

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Have no error</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Have no error")).toBeInTheDocument();
  });

  it("renders error state when a child component throws an error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ProblematicChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("There is an error")).toBeInTheDocument();
    vi.spyOn(console, "error").mockRestore();
  });
});
