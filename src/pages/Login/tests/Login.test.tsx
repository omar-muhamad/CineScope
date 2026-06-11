import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Mock } from "vitest";

import Login from "@/pages/Login";
import { supabase } from "@/lib/supabase";
import { renderWithProviders } from "@/tests/test-utils";

const signInWithOtp = supabase.auth.signInWithOtp as unknown as Mock;

describe("Login Page", () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
    signInWithOtp.mockResolvedValue({ data: {}, error: null });
  });

  test("renders the Google sign-in step when signed out", () => {
    renderWithProviders(<Login />, { route: "/login" });
    expect(screen.getByText("Sign in to CineScope")).toBeInTheDocument();
  });

  test("sends a magic link and shows the inbox confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await user.type(
      screen.getByLabelText("Email address"),
      "viewer@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send magic link" }));

    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: "viewer@example.com" }),
    );
    // Confirmation heading and the echoed address now live in separate nodes.
    expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
    expect(screen.getByText("viewer@example.com")).toBeInTheDocument();
  });

  test("does not show the confirmation when Supabase rejects the send", async () => {
    signInWithOtp.mockResolvedValue({
      data: {},
      error: { message: "rate limited" },
    });
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await user.type(
      screen.getByLabelText("Email address"),
      "viewer@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send magic link" }));

    expect(
      await screen.findByText(/couldn't send the link/i),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/check your inbox/i)).not.toBeInTheDocument(),
    );
  });
});
