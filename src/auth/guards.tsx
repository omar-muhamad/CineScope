import { Navigate, Outlet, useLocation } from "react-router-dom";

import Loading from "@/components/common/Loading";
import { normalizePath } from "@/lib/paths";
import { useAuth } from "./useAuth";

/**
 * Authed-only pages (/profile, /onboarding): wait for the session to resolve,
 * then gate. Signed-out visitors land on /login.
 */
export const RequireAuth = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

/**
 * Mandatory-onboarding enforcement, wrapped around ALL routes. Public pages
 * render immediately while the session is still loading (no blocking spinner
 * for visitors); once it resolves, an incomplete profile is bounced into the
 * wizard from anywhere, and a completed one is bounced back out of it. This —
 * not a magic-link newUserCallbackURL — routes first-time users, so it also
 * catches anyone who abandoned onboarding mid-way.
 */
export const OnboardingGate = () => {
  const { user, loading } = useAuth();
  const pathname = normalizePath(useLocation().pathname);

  if (!loading && user) {
    if (!user.onboardingComplete && pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
    if (user.onboardingComplete && pathname === "/onboarding") {
      return <Navigate to="/" replace />;
    }
  }
  return <Outlet />;
};
