import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";

import Login from "@/pages/Login";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const { loginMock, registerMock, resendVerificationMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  registerMock: vi.fn(),
  resendVerificationMock: vi.fn(),
}));

vi.mock("@/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/auth")>();
  return {
    ...actual,
    login: loginMock,
    register: registerMock,
    resendVerification: resendVerificationMock,
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

const fillCredentials = async (
  user: ReturnType<typeof userEvent.setup>,
  email = "viewer@example.com",
  password = "password123",
) => {
  await user.type(screen.getByLabelText("Email address"), email);
  await user.type(screen.getByLabelText("Password"), password);
};

beforeEach(() => {
  loginMock.mockReset();
  registerMock.mockReset();
  resendVerificationMock.mockReset();
});

describe("Login Page", () => {
  test("renders the sign-in form when signed out", () => {
    renderWithProviders(<Login />, { route: "/login" });
    expect(screen.getByText("Sign in to CineScope")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  test("submits credentials on sign-in", async () => {
    loginMock.mockResolvedValue(testUser);
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(loginMock).toHaveBeenCalledWith("viewer@example.com", "password123");
  });

  test("surfaces the API message on bad credentials", async () => {
    loginMock.mockRejectedValue(
      apiError(401, "INVALID_CREDENTIALS", "Incorrect email or password."),
    );
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Incorrect email or password."),
    ).toBeInTheDocument();
  });

  test("shows the verification notice when the email is unverified", async () => {
    loginMock.mockRejectedValue(
      apiError(403, "EMAIL_NOT_VERIFIED", "Verify your email first."),
    );
    resendVerificationMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
    expect(screen.getByText("viewer@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resend email" }));
    expect(resendVerificationMock).toHaveBeenCalledWith("viewer@example.com");
    expect(await screen.findByText("Email sent!")).toBeInTheDocument();
  });

  test("creates an account and shows the inbox confirmation", async () => {
    registerMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    expect(screen.getByText("Create your account")).toBeInTheDocument();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(registerMock).toHaveBeenCalledWith(
      "viewer@example.com",
      "password123",
    );
    expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
    expect(screen.getByText("viewer@example.com")).toBeInTheDocument();
  });

  test("does not show the confirmation when registration fails", async () => {
    registerMock.mockRejectedValue(
      apiError(
        409,
        "EMAIL_TAKEN",
        "An account with this email already exists. Try logging in.",
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(screen.queryByText(/check your inbox/i)).not.toBeInTheDocument();
  });
});
