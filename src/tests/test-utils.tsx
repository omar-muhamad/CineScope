import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import type { AuthUser } from "@/api/auth";
import { AuthProvider } from "@/auth/AuthProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";

/** Shared auth fixture so tests don't redefine this everywhere. */
export const testUser: AuthUser = {
  id: "u-1",
  email: "omar@example.com",
  emailVerified: true,
  name: "Omar Muhammad",
  avatarUrl: null,
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
  /** Seed the AuthProvider with a signed-in user (null = signed out). */
  user?: AuthUser | null;
  /** Initial router entry. */
  route?: string;
  queryClient?: QueryClient;
};

/**
 * Render a component inside the app's real provider stack
 * (QueryClient → GoogleOAuth → Auth → Router). The user is seeded directly via
 * the AuthProvider seam, so no network is touched; data-layer calls
 * (`@/api/saved`, `@/api/auth`) are mocked per test where needed.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { user = null, route = "/", queryClient }: RenderOptions = {},
) => {
  const client = queryClient ?? makeTestQueryClient();

  return render(
    <QueryClientProvider client={client}>
      <GoogleOAuthProvider clientId="test-google-client">
        <AuthProvider initialUser={user}>
          <MemoryRouter initialEntries={[route]}>
            {/* Catch thrown suspense-query errors so a rejected mock surfaces as
                the error UI instead of an uncaught throw out of render. */}
            <ErrorBoundary>{ui}</ErrorBoundary>
          </MemoryRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>,
  );
};
