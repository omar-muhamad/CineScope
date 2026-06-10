import { screen } from "@testing-library/react";

import RequireAuth from "@/components/common/RequireAuth";
import {
  googleUser,
  renderWithProviders,
  tmdbAccount,
} from "@/tests/test-utils";

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

  it("renders children when signed in with Google", () => {
    renderWithProviders(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>,
      { auth: { google: googleUser } },
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("requires a linked TMDB account when requireTmdb is set", () => {
    renderWithProviders(
      <RequireAuth requireTmdb>
        <div>Protected Content</div>
      </RequireAuth>,
      { auth: { google: googleUser } },
    );
    expect(screen.getByText("Connect your TMDB account")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("renders children when Google and TMDB are both connected", () => {
    renderWithProviders(
      <RequireAuth requireTmdb>
        <div>Protected Content</div>
      </RequireAuth>,
      { auth: { google: googleUser, tmdb: tmdbAccount } },
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
