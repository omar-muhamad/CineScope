import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";

import { AuthProvider } from "@/auth/AuthProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";

/** Shared auth fixtures so tests don't redefine these everywhere. */
export const testUser = {
  id: "u-1",
  email: "omar@example.com",
  user_metadata: { full_name: "Omar Muhammad" },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
} as unknown as User;

export const testSession = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: testUser,
} as unknown as Session;

/** A query client with retries off so failures surface immediately in tests. */
export const makeTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

type RenderOptions = {
  /** Seed the AuthProvider with a signed-in session (null = signed out). */
  session?: Session | null;
  /** Initial router entry. */
  route?: string;
  queryClient?: QueryClient;
};

/**
 * Render a component inside the app's real provider stack
 * (QueryClient → Auth → Router). The Supabase client is mocked globally in
 * `setup.ts`; the session is seeded directly via the AuthProvider seam.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { session = null, route = "/", queryClient }: RenderOptions = {},
) => {
  const client = queryClient ?? makeTestQueryClient();

  return render(
    <QueryClientProvider client={client}>
      <AuthProvider initialSession={session}>
        <MemoryRouter initialEntries={[route]}>
          {/* Catch thrown suspense-query errors so a rejected mock surfaces as
              the error UI instead of an uncaught throw out of render. */}
          <ErrorBoundary>{ui}</ErrorBoundary>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
};
