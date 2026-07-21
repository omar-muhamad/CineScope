import { screen, fireEvent } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";

import UserCard from "@/components/ui/UserCard";
import { authClient } from "@/lib/auth-client";
import { renderWithProviders, testUser } from "@/tests/test-utils";

describe("UserCard", () => {
  it("greets the signed-in user by first name", () => {
    renderWithProviders(<UserCard />, { user: testUser });
    expect(screen.getByText("Hi, Omar!")).toBeInTheDocument();
  });

  it('shows "Hi, User!" when signed out', () => {
    renderWithProviders(<UserCard />);
    expect(screen.getByText("Hi, User!")).toBeInTheDocument();
  });

  it('shows the "Logout" button when signed in', () => {
    renderWithProviders(<UserCard />, { user: testUser });
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it('shows the "Login" button when signed out', () => {
    renderWithProviders(<UserCard />);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("hides the Profile link when signed out", () => {
    renderWithProviders(<UserCard />);
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
  });

  it("navigates to the profile page and closes the dropdown", () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<UserCard onClose={onClose} />} />
        <Route path="/profile" element={<div>PROFILE PAGE</div>} />
      </Routes>,
      { user: testUser },
    );

    fireEvent.click(screen.getByText("Profile"));

    expect(onClose).toHaveBeenCalled();
    expect(screen.getByText("PROFILE PAGE")).toBeInTheDocument();
  });

  it("shows a loading state on the logout button while signing out", async () => {
    let finishSignOut!: () => void;
    const signOutMock = vi.mocked(authClient.signOut).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSignOut = () =>
            resolve({ data: { success: true }, error: null });
        }),
    );

    renderWithProviders(<UserCard />, { user: testUser });
    fireEvent.click(screen.getByText("Logout"));

    const button = screen.getByRole("button", { name: /logging out/i });
    expect(button).toBeDisabled();

    // A second click while the request is in flight must not sign out twice.
    fireEvent.click(button);
    expect(signOutMock).toHaveBeenCalledTimes(1);

    finishSignOut();
    await vi.waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
  });

  it("signs out via Better Auth on logout", async () => {
    const signOutMock = vi
      .mocked(authClient.signOut)
      .mockResolvedValue({ data: { success: true }, error: null });

    renderWithProviders(<UserCard />, { user: testUser });
    fireEvent.click(screen.getByText("Logout"));

    await vi.waitFor(() => expect(signOutMock).toHaveBeenCalled());
  });
});
