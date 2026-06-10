import { configureStore } from "@reduxjs/toolkit";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import UserCard from "@/components/ui/UserCard";
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

const renderCard = (userState: Partial<UserState>) => {
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
      <MemoryRouter>
        <UserCard />
      </MemoryRouter>
    </Provider>,
  );
};

describe("UserCard", () => {
  it("greets the signed-in user by first name", () => {
    renderCard({ google: googleUser, tmdb: tmdbAccount });
    expect(screen.getByText("Hi, Omar!")).toBeInTheDocument();
  });

  it('shows "Hi, User!" when signed out', () => {
    renderCard({});
    expect(screen.getByText("Hi, User!")).toBeInTheDocument();
  });

  it('shows the "Logout" button when signed in', () => {
    renderCard({ google: googleUser, tmdb: tmdbAccount });
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it('shows the "Login" button when signed out', () => {
    renderCard({});
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("prompts to connect TMDB when Google is linked but TMDB is not", () => {
    renderCard({ google: googleUser });
    expect(screen.getByText("Connect TMDB account")).toBeInTheDocument();
  });

  it("returns to a signed-out state after logout", async () => {
    renderCard({ google: googleUser });
    fireEvent.click(screen.getByText("Logout"));
    expect(await screen.findByText("Login")).toBeInTheDocument();
  });
});
