import "@testing-library/jest-dom/vitest";

// The real authClient is a better-auth Proxy whose properties can't be
// vi.spyOn'd — replace the module with plain vi.fn()s for every method the
// app calls. Tests drive it through test-utils (seedSession) and
// vi.mocked(authClient.*); restoreMocks in vitest.config.ts resets all of
// these between tests.
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
    signIn: { magicLink: vi.fn(), social: vi.fn() },
    updateUser: vi.fn(),
    changeEmail: vi.fn(),
    getSession: vi.fn(),
  },
}));

// useAuth fetches the uploaded avatar (GET /api/avatar) for every signed-in
// render — stub it so tests never touch the network. Tests that care about an
// uploaded avatar can override with vi.mocked(fetchAvatar).mockResolvedValue.
vi.mock("@/api/avatar", () => ({
  fetchAvatar: vi.fn(),
}));

// The config-level reset flags only cover vi.spyOn spies — reset the module
// mock's vi.fn()s explicitly so call history and per-test implementations
// never leak between tests. (Dynamic import: resolves to the mock above.)
beforeEach(async () => {
  const { authClient } = await import("@/lib/auth-client");
  [
    authClient.useSession,
    authClient.signOut,
    authClient.signIn.magicLink,
    authClient.signIn.social,
    authClient.updateUser,
    authClient.changeEmail,
    authClient.getSession,
  ].forEach((fn) => vi.mocked(fn).mockReset());

  const { fetchAvatar } = await import("@/api/avatar");
  vi.mocked(fetchAvatar).mockReset().mockResolvedValue(null);
});
