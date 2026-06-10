import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import RequireAuth from "@/components/common/RequireAuth";
import userReducer, { UserState } from "@/redux/user/userSlice";

const googleUser = {
  sub: "g-1",
  name: "Omar Muhammad",
  email: "omar@example.com",
  picture: "",
};

const tmdbAccount = {
  session_id: "session-1",
  account_id: 1,
  username: "omar",
  name: "Omar",
  avatarHash: null,
  avatarPath: null,
};

const renderWithAuth = (ui: React.ReactNode, userState: Partial<UserState>) => {
  const store = configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: {
        google: null,
        tmdb: null,
        loading: false,
        error: null,
        ...userState,
      },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );
};

describe("RequireAuth", () => {
  it("renders the login gate when not signed in", () => {
    renderWithAuth(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>,
      {},
    );
    expect(screen.getByText("Page content is protected")).toBeInTheDocument();
    expect(screen.getByText("Please Login First")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("renders children when signed in with Google", () => {
    renderWithAuth(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>,
      { google: googleUser },
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("requires a linked TMDB account when requireTmdb is set", () => {
    renderWithAuth(
      <RequireAuth requireTmdb>
        <div>Protected Content</div>
      </RequireAuth>,
      { google: googleUser },
    );
    expect(screen.getByText("Connect your TMDB account")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("renders children when Google and TMDB are both connected", () => {
    renderWithAuth(
      <RequireAuth requireTmdb>
        <div>Protected Content</div>
      </RequireAuth>,
      { google: googleUser, tmdb: tmdbAccount },
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
