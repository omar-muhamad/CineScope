import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";

import Login from "@/pages/Login";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const {
  loginMock,
  registerMock,
  resendVerificationMock,
  requestPasswordResetMock,
} = vi.hoisted(() => ({
  loginMock: vi.fn(),
  registerMock: vi.fn(),
  resendVerificationMock: vi.fn(),
  requestPasswordResetMock: vi.fn(),
}));

vi.mock("@/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/auth")>();
  return {
    ...actual,
    login: loginMock,
    register: registerMock,
    resendVerification: resendVerificationMock,
    requestPasswordReset: requestPasswordResetMock,
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

const fillLogin = async (
  user: ReturnType<typeof userEvent.setup>,
  identifier = "viewer@example.com",
  password = "password123",
) => {
  await user.type(screen.getByLabelText("Email or username"), identifier);
  await user.type(screen.getByLabelText("Password"), password);
};

const fillRegister = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("First name"), "Viewer");
  await user.type(screen.getByLabelText("Last name"), "Person");
  await user.type(screen.getByLabelText("Username"), "viewer_1");
  await user.type(screen.getByLabelText("Email address"), "viewer@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm password"), "password123");
};

beforeEach(() => {
  loginMock.mockReset();
  registerMock.mockReset();
  resendVerificationMock.mockReset();
  requestPasswordResetMock.mockReset();
});

describe("Login Page", () => {
  test("renders the sign-in form when signed out", () => {
    renderWithProviders(<Login />, { route: "/login" });
    expect(screen.getByText("Sign in to CineScope")).toBeInTheDocument();
    expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  test("submits the identifier and password on sign-in", async () => {
    loginMock.mockResolvedValue(testUser);
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await fillLogin(user, "omar", "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(loginMock).toHaveBeenCalledWith("omar", "password123");
  });

  test("surfaces the API message on bad credentials", async () => {
    loginMock.mockRejectedValue(
      apiError(
        401,
        "INVALID_CREDENTIALS",
        "Incorrect email/username or password.",
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await fillLogin(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Incorrect email/username or password."),
    ).toBeInTheDocument();
  });

  test("offers a password reset after bad credentials and sends the link", async () => {
    loginMock.mockRejectedValue(
      apiError(
        401,
        "INVALID_CREDENTIALS",
        "Incorrect email/username or password.",
      ),
    );
    requestPasswordResetMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    // No forgot-password affordance until a login attempt actually fails.
    expect(
      screen.queryByRole("button", { name: "Forgot your password?" }),
    ).not.toBeInTheDocument();

    await fillLogin(user, "omar");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await user.click(
      await screen.findByRole("button", { name: "Forgot your password?" }),
    );
    expect(screen.getByText("Reset your password")).toBeInTheDocument();
    // The identifier from the failed attempt carries over.
    expect(screen.getByLabelText("Email or username")).toHaveValue("omar");

    await user.click(
      screen.getByRole("button", { name: "Email me a reset link" }),
    );
    expect(requestPasswordResetMock).toHaveBeenCalledWith("omar");
    expect(
      await screen.findByText(/a reset link is on its way/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(screen.getByText("Sign in to CineScope")).toBeInTheDocument();
  });

  test("shows the verification notice when the email is unverified", async () => {
    loginMock.mockRejectedValue(
      apiError(403, "EMAIL_NOT_VERIFIED", "Verify your email first."),
    );
    resendVerificationMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await fillLogin(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
    expect(screen.getByText("viewer@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resend email" }));
    expect(resendVerificationMock).toHaveBeenCalledWith("viewer@example.com");
    expect(await screen.findByText("Email sent!")).toBeInTheDocument();
  });

  test("creates an account with the profile fields and shows the inbox confirmation", async () => {
    registerMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    expect(screen.getByText("Create your account")).toBeInTheDocument();

    await fillRegister(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(registerMock).toHaveBeenCalledWith({
      email: "viewer@example.com",
      password: "password123",
      firstName: "Viewer",
      lastName: "Person",
      username: "viewer_1",
      avatar: undefined,
    });
    expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
    expect(screen.getByText("viewer@example.com")).toBeInTheDocument();
  });

  test("blocks registration when the passwords don't match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await user.type(screen.getByLabelText("First name"), "Viewer");
    await user.type(screen.getByLabelText("Last name"), "Person");
    await user.type(screen.getByLabelText("Username"), "viewer_1");
    await user.type(
      screen.getByLabelText("Email address"),
      "viewer@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password456");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Passwords don't match."),
    ).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  test("does not show the confirmation when registration fails", async () => {
    registerMock.mockRejectedValue(
      apiError(409, "USERNAME_TAKEN", "This username is already taken."),
    );
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await fillRegister(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(/username is already taken/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/check your inbox/i)).not.toBeInTheDocument();
  });

  test("toggles password visibility with the eye button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });
});
