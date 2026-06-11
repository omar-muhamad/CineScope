import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// The Supabase client is constructed at import time and would otherwise need
// real env vars. Tests seed auth via `initialSession` and mock the data layer
// (`@/api/saved`), so a lightweight stub covers the only client call that runs
// in tests (signOut, during the logout flow).
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(),
  },
}));
