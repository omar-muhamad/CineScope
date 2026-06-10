import { screen } from "@testing-library/react";

import Login from "@/pages/Login";
import { renderWithProviders } from "@/tests/test-utils";

describe("Login Page", () => {
  test("renders the Google sign-in step when signed out", () => {
    renderWithProviders(<Login />, { route: "/login" });
    expect(screen.getByText("Sign in to CineScope")).toBeInTheDocument();
  });
});
