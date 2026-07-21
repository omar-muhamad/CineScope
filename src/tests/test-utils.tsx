import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import type { AuthUser } from "@/auth/useAuth";
import { authClient, type SessionUser } from "@/lib/auth-client";
import ErrorBoundary from "@/components/common/ErrorBoundary";

/** Shared auth fixture so tests don't redefine this everywhere. */
export const testUser: AuthUser = {
  id: "u-1",
  email: "omar@example.com",
  emailVerified: true,
  username: "omar",
  firstName: "Omar",
  lastName: "Muhammad",
  avatarUrl: null,
  onboardingComplete: true,
};

/** Map the app-facing fixture shape onto the raw Better Auth session user. */
export const toSessionUser = (user: AuthUser): SessionUser => ({
  id: user.id,
  email: user.email,
  emailVerified: user.emailVerified,
  name: [user.firstName, user.lastName].filter(Boolean).join(" "),
  image: user.avatarUrl,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  onboardingComplete: user.onboardingComplete,
});

type UseSessionReturn = ReturnType<typeof authClient.useSession>;

type SeedOptions = {
  /** Simulate the initial session fetch still being in flight. */
  pending?: boolean;
  /** Patch raw Better Auth fields (e.g. a Google `name` with no first/last). */
  overrides?: Partial<SessionUser>;
};

/**
 * Stub Better Auth's session hook — the seam every component reads auth state
 * through (via useAuth). The module itself is mocked in setup.ts (the real
 * client is a Proxy that can't be spied on); mocks reset automatically
 * between tests. Returns the refetch spy for assertions.
 */
export const seedSession = (
  user: AuthUser | null,
  { pending = false, overrides }: SeedOptions = {},
) => {
  const refetch = vi.fn().mockResolvedValue(undefined);
  vi.mocked(authClient.useSession).mockReturnValue({
    data:
      user && !pending
        ? {
            user: { ...toSessionUser(user), ...overrides },
            session: {
              id: "s-1",
              token: "t-1",
              userId: user.id,
              expiresAt: new Date(Date.now() + 86_400_000),
              createdAt: new Date(),
              updatedAt: new Date(),
              ipAddress: null,
              userAgent: null,
            },
          }
        : null,
    isPending: pending,
    isRefetching: false,
    error: null,
    refetch,
  } as unknown as UseSessionReturn);
  return { refetch };
};

/** A query client with retries off so failures surface immediately in tests. */
export const makeTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

type RenderOptions = {
  /** Seed the session store with a signed-in user (null = signed out). */
  user?: AuthUser | null;
  /** Initial router entry. */
  route?: string;
  queryClient?: QueryClient;
  /** Extra session-seeding knobs (pending state, raw field overrides). */
  session?: SeedOptions;
};

/**
 * Render a component inside the app's real provider stack
 * (QueryClient → Router). Auth state is seeded by stubbing Better Auth's
 * useSession, so no network is touched; data-layer calls (`@/api/saved`)
 * are mocked per test where needed.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { user = null, route = "/", queryClient, session }: RenderOptions = {},
) => {
  const client = queryClient ?? makeTestQueryClient();
  const { refetch } = seedSession(user, session);

  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        {/* Catch thrown suspense-query errors so a rejected mock surfaces as
            the error UI instead of an uncaught throw out of render. */}
        <ErrorBoundary>{ui}</ErrorBoundary>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  /** `sessionRefetch` is the seeded session's refetch spy. */
  return Object.assign(result, { sessionRefetch: refetch });
};
