import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Profile from "@/pages/Profile";
import { authClient } from "@/lib/auth-client";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const updateUserOk = () =>
  vi
    .mocked(authClient.updateUser)
    .mockResolvedValue({ data: { status: true }, error: null } as never);

describe("Profile", () => {
  it("prefills the form from the session user", () => {
    renderWithProviders(<Profile />, { user: testUser });
    expect(screen.getByLabelText("First name")).toHaveValue("Omar");
    expect(screen.getByLabelText("Last name")).toHaveValue("Muhammad");
    expect(screen.getByLabelText("Username")).toHaveValue("omar");
    expect(screen.getByText(testUser.email)).toBeInTheDocument();
  });

  it("saves only the changed fields and keeps the display name in sync", async () => {
    const user = userEvent.setup();
    const updateUser = updateUserOk();
    const { sessionRefetch } = renderWithProviders(<Profile />, {
      user: testUser,
    });

    const firstName = screen.getByLabelText("First name");
    await user.clear(firstName);
    await user.type(firstName, "Omar-Updated");
    await user.click(screen.getByText("Save changes"));

    expect(updateUser).toHaveBeenCalledWith({
      firstName: "Omar-Updated",
      lastName: "Muhammad",
      name: "Omar-Updated Muhammad",
    });
    expect(await screen.findByText("Saved!")).toBeInTheDocument();
    expect(sessionRefetch).toHaveBeenCalled();
  });

  it("does not call the API when nothing changed", async () => {
    const user = userEvent.setup();
    const updateUser = updateUserOk();
    renderWithProviders(<Profile />, { user: testUser });

    await user.click(screen.getByText("Save changes"));

    expect(updateUser).not.toHaveBeenCalled();
    expect(await screen.findByText(/Nothing to save/)).toBeInTheDocument();
  });

  it("maps USERNAME_TAKEN onto the username error copy", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.updateUser).mockResolvedValue({
      data: null,
      error: {
        status: 422,
        statusText: "Unprocessable Entity",
        code: "USERNAME_TAKEN",
      },
    } as never);
    renderWithProviders(<Profile />, { user: testUser });

    const username = screen.getByLabelText("Username");
    await user.clear(username);
    await user.type(username, "taken.name");
    await user.click(screen.getByText("Save changes"));

    expect(
      await screen.findByText(/username is already taken/),
    ).toBeInTheDocument();
  });

  it("requests an email change and shows the pending note", async () => {
    const user = userEvent.setup();
    const changeEmail = vi
      .mocked(authClient.changeEmail)
      .mockResolvedValue({ data: { status: true }, error: null } as never);
    renderWithProviders(<Profile />, { user: testUser });

    await user.type(
      screen.getByLabelText("New email address"),
      "next@example.com",
    );
    await user.click(screen.getByText("Change email"));

    expect(changeEmail).toHaveBeenCalledWith({
      newEmail: "next@example.com",
      callbackURL: "/profile",
    });
    // Destination-neutral pending copy; current address still shown.
    expect(
      await screen.findByText(/Confirmation link sent/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(testUser.email).length).toBeGreaterThan(0);
  });
});
