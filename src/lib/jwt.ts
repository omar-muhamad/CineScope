export type GoogleUser = {
  sub: string;
  name: string;
  email: string;
  picture: string;
};

/**
 * Decode the payload of a Google ID token (a JWT) without verifying its
 * signature. In this client-only setup the token is used purely for identity
 * (name / email / avatar) and UI gating, so a local decode is sufficient.
 */
export const decodeGoogleCredential = (credential: string): GoogleUser => {
  const payload = credential.split(".")[1];
  if (!payload) throw new Error("Malformed Google credential.");

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(normalized)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
  const claims = JSON.parse(json);

  return {
    sub: claims.sub,
    name: claims.name ?? claims.email,
    email: claims.email,
    picture: claims.picture ?? "",
  };
};
