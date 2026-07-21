/**
 * React Router matches "/onboarding/" to the "/onboarding" route, so any
 * exact-string pathname comparison must normalize trailing slashes too or
 * the slashed variant slips through it.
 */
export const normalizePath = (pathname: string) =>
  pathname.replace(/\/+$/, "") || "/";
