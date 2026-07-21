import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";

import Onboarding from "@/pages/Onboarding";
import { authClient } from "@/lib/auth-client";
import { renderWithProviders, testUser } from "@/tests/test-utils";
import type { AuthUser } from "@/auth/useAuth";

/** A first-run Google sign-up: name/photo from Google, nothing else set. */
const googleUser: AuthUser = {
  ...testUser,
  firstName: null,
  lastName: null,
  username: null,
  avatarUrl: "https://lh3.googleusercontent.com/photo",
  onboardingComplete: false,
};

const updateUserOk = () =>
  vi
    .mocked(authClient.updateUser)
    .mockResolvedValue({ data: { status: true }, error: null } as never);

const renderOnboarding = (user: AuthUser, overrides?: { name?: string }) =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<div>HOME PAGE</div>} />
      <Route path="/onboarding" element={<Onboarding />} />
    </Routes>,
    { route: "/onboarding", user, session: { overrides } },
  );

/** Complete steps 1 and 2 to reach the avatar step. */
const advanceToAvatarStep = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.click(screen.getByText("Continue")); // name step (prefilled)
  await screen.findByText("Pick a username");
  await user.type(screen.getByLabelText("Username"), "omar");
  await user.click(screen.getByText("Continue"));
  await screen.findByText("Add a profile photo");
};

describe("Onboarding", () => {
  it("prefills the name step by splitting the Google display name", () => {
    renderOnboarding(googleUser, { name: "Omar Muhammad" });
    expect(screen.getByLabelText("First name")).toHaveValue("Omar");
    expect(screen.getByLabelText("Last name")).toHaveValue("Muhammad");
  });

  it("commits the name step and advances to the username step", async () => {
    const user = userEvent.setup();
    const updateUser = updateUserOk();
    renderOnboarding(googleUser, { name: "Omar Muhammad" });

    await user.click(screen.getByText("Continue"));

    expect(updateUser).toHaveBeenCalledWith({
      firstName: "Omar",
      lastName: "Muhammad",
      name: "Omar Muhammad",
    });
    expect(await screen.findByText("Pick a username")).toBeInTheDocument();
  });

  it("shows a friendly error when the username is taken", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.updateUser)
      .mockResolvedValueOnce({ data: { status: true }, error: null } as never)
      .mockResolvedValueOnce({
        data: null,
        error: {
          status: 422,
          statusText: "Unprocessable Entity",
          code: "USERNAME_TAKEN",
        },
      } as never);
    renderOnboarding(googleUser, { name: "Omar Muhammad" });

    await user.click(screen.getByText("Continue"));
    await screen.findByText("Pick a username");
    await user.type(screen.getByLabelText("Username"), "omar");
    await user.click(screen.getByText("Continue"));

    expect(
      await screen.findByText(/username is already taken/),
    ).toBeInTheDocument();
    // Still on the username step.
    expect(screen.getByText("Pick a username")).toBeInTheDocument();
  });

  it("finishes: flips onboardingComplete, refetches the session, goes home", async () => {
    const user = userEvent.setup();
    const updateUser = updateUserOk();
    const { sessionRefetch } = renderOnboarding(googleUser, {
      name: "Omar Muhammad",
    });

    await advanceToAvatarStep(user);
    await user.click(screen.getByText("Finish"));

    expect(await screen.findByText("HOME PAGE")).toBeInTheDocument();
    // Avatar unchanged (Google photo kept) — no image in the final payload.
    expect(updateUser).toHaveBeenLastCalledWith({ onboardingComplete: true });
    expect(sessionRefetch).toHaveBeenCalled();
  });

  it("skips the avatar step without touching the image", async () => {
    const user = userEvent.setup();
    const updateUser = updateUserOk();
    renderOnboarding(googleUser, { name: "Omar Muhammad" });

    await advanceToAvatarStep(user);
    await user.click(screen.getByText("Skip for now"));

    expect(await screen.findByText("HOME PAGE")).toBeInTheDocument();
    expect(updateUser).toHaveBeenLastCalledWith({ onboardingComplete: true });
  });
});
