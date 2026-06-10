import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "./AuthContext";

/** Access the current auth state and actions. Must be used within AuthProvider. */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
