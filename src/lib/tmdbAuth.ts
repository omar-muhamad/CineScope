import { tmdb } from "./tmdb";

export type TmdbAccount = {
  session_id: string;
  account_id: number;
  username: string;
  name: string;
  avatarHash: string | null;
  avatarPath: string | null;
};

/** Client route that TMDB redirects back to after the user approves access. */
export const TMDB_CALLBACK_PATH = "/auth/tmdb/callback";

/** Step 1 — create a fresh request token to be approved by the user. */
export const createRequestToken = async (): Promise<string> => {
  const { data } = await tmdb.get("/authentication/token/new");
  if (!data?.request_token) {
    throw new Error("Could not create a TMDB request token.");
  }
  return data.request_token as string;
};

/**
 * Step 2 — send the user to themoviedb.org to approve the request token. On
 * approval TMDB redirects back to TMDB_CALLBACK_PATH with the request token in
 * the query string. This navigates away from the app.
 */
export const redirectToTmdbApproval = (requestToken: string): void => {
  const redirectTo = `${window.location.origin}${TMDB_CALLBACK_PATH}`;
  window.location.assign(
    `https://www.themoviedb.org/authenticate/${requestToken}` +
      `?redirect_to=${encodeURIComponent(redirectTo)}`,
  );
};

/** Step 3 — exchange an approved request token for a session id. */
export const createSession = async (requestToken: string): Promise<string> => {
  const { data } = await tmdb.post("/authentication/session/new", {
    request_token: requestToken,
  });
  if (!data?.session_id) {
    throw new Error("TMDB session could not be created. Was access approved?");
  }
  return data.session_id as string;
};

/** Fetch the account profile tied to a session id. */
export const getAccount = async (
  sessionId: string,
): Promise<Omit<TmdbAccount, "session_id">> => {
  const { data } = await tmdb.get("/account", {
    params: { session_id: sessionId },
  });
  return {
    account_id: data.id,
    username: data.username,
    name: data.name || data.username,
    avatarHash: data.avatar?.gravatar?.hash ?? null,
    avatarPath: data.avatar?.tmdb?.avatar_path ?? null,
  };
};

/** Invalidate a session id on TMDB's side (best-effort on logout). */
export const deleteSession = async (sessionId: string): Promise<void> => {
  await tmdb.delete("/authentication/session", {
    data: { session_id: sessionId },
  });
};
