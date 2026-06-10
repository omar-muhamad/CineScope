import { screen } from "@testing-library/react";

import RequireAuth from "@/components/common/RequireAuth";
import { renderWithProviders, testSession } from "@/tests/test-utils";

describe("RequireAuth", () => {
  it("renders the login gate when not signed in", () => {
    renderWithProviders(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>,
    );
    expect(screen.getByText("Page content is protected")).toBeInTheDocument();
    expect(screen.getByText("Please Login First")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("renders children when signed in", () => {
    renderWithProviders(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>,
      { session: testSession },
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
