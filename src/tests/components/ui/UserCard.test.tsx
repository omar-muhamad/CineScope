import { screen, fireEvent } from "@testing-library/react";

import UserCard from "@/components/ui/UserCard";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }));

vi.mock("@/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/auth")>();
  return { ...actual, logout: logoutMock };
});

beforeEach(() => {
  logoutMock.mockReset();
  logoutMock.mockResolvedValue(undefined);
});

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

  it("returns to a signed-out state after logout", async () => {
    renderWithProviders(<UserCard />, { user: testUser });
    fireEvent.click(screen.getByText("Logout"));
    expect(await screen.findByText("Login")).toBeInTheDocument();
    expect(logoutMock).toHaveBeenCalled();
  });
});
