import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";

import ResetPassword from "@/pages/ResetPassword";
import { renderWithProviders } from "@/tests/test-utils";

const { resetPasswordMock } = vi.hoisted(() => ({
  resetPasswordMock: vi.fn(),
}));

vi.mock("@/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/auth")>();
  return {
    ...actual,
    resetPassword: resetPasswordMock,
  };
});

/** An error shaped like the API's `{ code, message }` responses. */
const apiError = (status: number, code: string, message: string) => {
  const error = new AxiosError(message);
  error.response = {
    status,
    data: { code, message },
  } as AxiosError["response"];
  return error;
};

const fillPasswords = async (
  user: ReturnType<typeof userEvent.setup>,
  password = "newpassword123",
  confirm = password,
) => {
  await user.type(screen.getByLabelText("New password"), password);
  await user.type(screen.getByLabelText("Confirm new password"), confirm);
};

beforeEach(() => {
  resetPasswordMock.mockReset();
});

describe("ResetPassword Page", () => {
  test("submits the new password with the token from the link", async () => {
    resetPasswordMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ResetPassword />, {
      route: "/reset-password?token=tok-123",
    });

    expect(screen.getByText("Choose a new password")).toBeInTheDocument();

    await fillPasswords(user);
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(resetPasswordMock).toHaveBeenCalledWith("tok-123", "newpassword123");
    expect(await screen.findByText("Password updated!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  test("blocks the reset when the passwords don't match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPassword />, {
      route: "/reset-password?token=tok-123",
    });

    await fillPasswords(user, "newpassword123", "different456");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      await screen.findByText("Passwords don't match."),
    ).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  test("shows the failure state for an invalid or expired token", async () => {
    resetPasswordMock.mockRejectedValue(
      apiError(400, "INVALID_TOKEN", "This reset link is invalid."),
    );
    const user = userEvent.setup();
    renderWithProviders(<ResetPassword />, {
      route: "/reset-password?token=tok-dead",
    });

    await fillPasswords(user);
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      await screen.findByText("This link didn't work"),
    ).toBeInTheDocument();
  });

  test("shows the failure state when the link has no token", () => {
    renderWithProviders(<ResetPassword />, { route: "/reset-password" });
    expect(screen.getByText("This link didn't work")).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });
});
