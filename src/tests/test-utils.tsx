import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthProvider } from "@/auth/AuthProvider";
import type { GoogleUser } from "@/lib/jwt";
import type { TmdbAccount } from "@/lib/tmdbAuth";

type Identity = { google: GoogleUser | null; tmdb: TmdbAccount | null };

/** Shared auth fixtures so tests don't redefine these everywhere. */
export const googleUser: GoogleUser = {
  sub: "g-1",
  name: "Omar Muhammad",
  email: "omar@example.com",
  picture: "",
};

export const tmdbAccount: TmdbAccount = {
  session_id: "session-1",
  account_id: 1,
  username: "omar",
  name: "Omar",
  avatarHash: null,
  avatarPath: null,
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
  /** Seed the AuthProvider with a signed-in Google / TMDB identity. */
  auth?: Partial<Identity>;
  /** Initial router entry. */
  route?: string;
  queryClient?: QueryClient;
};

/**
 * Render a component inside the app's real provider stack (Google OAuth →
 * QueryClient → Auth → Router), the post-Redux replacement for the old
 * `<Provider store={store}>` test wrapper.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { auth, route = "/", queryClient }: RenderOptions = {},
) => {
  const client = queryClient ?? makeTestQueryClient();
  const initialAuth: Identity = {
    google: auth?.google ?? null,
    tmdb: auth?.tmdb ?? null,
  };

  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      <QueryClientProvider client={client}>
        <AuthProvider initialAuth={initialAuth}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>,
  );
};
