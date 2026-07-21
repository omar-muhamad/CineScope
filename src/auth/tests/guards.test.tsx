import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";

import { OnboardingGate, RequireAuth } from "@/auth/guards";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const incompleteUser = { ...testUser, onboardingComplete: false };

/** The app's real guard nesting (App.tsx) with stub pages. */
const guardedApp = (
  <Routes>
    <Route element={<OnboardingGate />}>
      <Route path="/" element={<div>HOME</div>} />
      <Route path="/login" element={<div>LOGIN</div>} />
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<div>ONBOARDING</div>} />
        <Route path="/profile" element={<div>PROFILE</div>} />
      </Route>
    </Route>
  </Routes>
);

describe("RequireAuth", () => {
  it("shows the loading state while the session resolves", () => {
    renderWithProviders(guardedApp, {
      route: "/profile",
      user: testUser,
      session: { pending: true },
    });
    expect(screen.getByTestId("loading-component")).toBeInTheDocument();
  });

  it("redirects signed-out visitors to /login", () => {
    renderWithProviders(guardedApp, { route: "/profile", user: null });
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  it("renders the protected page for a signed-in user", () => {
    renderWithProviders(guardedApp, { route: "/profile", user: testUser });
    expect(screen.getByText("PROFILE")).toBeInTheDocument();
  });
});

describe("OnboardingGate", () => {
  it("bounces an incomplete profile into the wizard from anywhere", () => {
    renderWithProviders(guardedApp, { route: "/", user: incompleteUser });
    expect(screen.getByText("ONBOARDING")).toBeInTheDocument();
  });

  it("keeps an incomplete profile on /onboarding", () => {
    renderWithProviders(guardedApp, {
      route: "/onboarding",
      user: incompleteUser,
    });
    expect(screen.getByText("ONBOARDING")).toBeInTheDocument();
  });

  it("bounces a completed profile out of the wizard", () => {
    renderWithProviders(guardedApp, { route: "/onboarding", user: testUser });
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });

  it("renders public pages while the session is still loading", () => {
    renderWithProviders(guardedApp, {
      route: "/",
      user: incompleteUser,
      session: { pending: true },
    });
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });

  it("leaves signed-out visitors alone", () => {
    renderWithProviders(guardedApp, { route: "/", user: null });
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });
});
