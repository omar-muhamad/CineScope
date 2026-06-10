import { screen, fireEvent } from "@testing-library/react";

import UserCard from "@/components/ui/UserCard";
import {
  googleUser,
  renderWithProviders,
  tmdbAccount,
} from "@/tests/test-utils";

describe("UserCard", () => {
  it("greets the signed-in user by first name", () => {
    renderWithProviders(<UserCard />, {
      auth: { google: googleUser, tmdb: tmdbAccount },
    });
    expect(screen.getByText("Hi, Omar!")).toBeInTheDocument();
  });

  it('shows "Hi, User!" when signed out', () => {
    renderWithProviders(<UserCard />);
    expect(screen.getByText("Hi, User!")).toBeInTheDocument();
  });

  it('shows the "Logout" button when signed in', () => {
    renderWithProviders(<UserCard />, {
      auth: { google: googleUser, tmdb: tmdbAccount },
    });
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it('shows the "Login" button when signed out', () => {
    renderWithProviders(<UserCard />);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("prompts to connect TMDB when Google is linked but TMDB is not", () => {
    renderWithProviders(<UserCard />, { auth: { google: googleUser } });
    expect(screen.getByText("Connect TMDB account")).toBeInTheDocument();
  });

  it("returns to a signed-out state after logout", async () => {
    renderWithProviders(<UserCard />, { auth: { google: googleUser } });
    fireEvent.click(screen.getByText("Logout"));
    expect(await screen.findByText("Login")).toBeInTheDocument();
  });
});
