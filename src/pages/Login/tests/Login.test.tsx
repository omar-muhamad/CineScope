import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";

import Login from "@/pages/Login";
import { authClient } from "@/lib/auth-client";
import { renderWithProviders, testUser } from "@/tests/test-utils";
import type { AuthUser } from "@/auth/useAuth";

const renderLogin = (route = "/login", user: AuthUser | null = null) =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<div>HOME PAGE</div>} />
      <Route path="/login" element={<Login />} />
    </Routes>,
    { route, user },
  );

const magicLinkOk = () =>
  vi
    .mocked(authClient.signIn.magicLink)
    .mockResolvedValue({ data: { status: true }, error: null } as never);

describe("Login", () => {
  it("renders the Google button and the magic-link email form", () => {
    renderLogin();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByText("Email me a sign-in link")).toBeInTheDocument();
    // No password anywhere.
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it("sends a magic link and shows the sent panel", async () => {
    const user = userEvent.setup();
    const magicLink = magicLinkOk();
    renderLogin();

    await user.type(screen.getByLabelText("Email address"), "new@example.com");
    await user.click(screen.getByText("Email me a sign-in link"));

    expect(magicLink).toHaveBeenCalledWith({
      email: "new@example.com",
      callbackURL: "/",
      errorCallbackURL: "/login",
    });
    expect(await screen.findByText("Check your inbox")).toBeInTheDocument();
    expect(screen.getByText("new@example.com")).toBeInTheDocument();
  });

  it("shows rate-limit copy on a 429", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.magicLink).mockResolvedValue({
      data: null,
      error: { status: 429, statusText: "Too Many Requests" },
    } as never);
    renderLogin();

    await user.type(screen.getByLabelText("Email address"), "new@example.com");
    await user.click(screen.getByText("Email me a sign-in link"));

    expect(
      await screen.findByText(/Too many sign-in emails requested/),
    ).toBeInTheDocument();
  });

  it("surfaces a failed magic-link verification from the query string", () => {
    renderLogin("/login?error=INVALID_TOKEN");
    expect(
      screen.getByText(/sign-in link is invalid or has expired/),
    ).toBeInTheDocument();
  });

  it("starts the Google redirect flow", async () => {
    const user = userEvent.setup();
    // The real call navigates away; a never-resolving promise mimics that.
    const social = vi
      .mocked(authClient.signIn.social)
      .mockReturnValue(new Promise(() => {}) as never);
    renderLogin();

    await user.click(screen.getByText("Continue with Google"));

    expect(social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/login",
    });
    expect(screen.getByText("Redirecting to Google...")).toBeInTheDocument();
  });

  it("redirects signed-in users into the app", () => {
    renderLogin("/login", testUser);
    expect(screen.getByText("HOME PAGE")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
  });
});
