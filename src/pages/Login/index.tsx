import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  IoMailOutline,
  IoPersonOutline,
  IoAtOutline,
  IoCameraOutline,
  IoHeartOutline,
  IoTimeOutline,
  IoFilmOutline,
  IoKeyOutline,
} from "react-icons/io5";

import { useAuth } from "@/auth/useAuth";
import { requestPasswordReset, resendVerification } from "@/api/auth";
import { getApiError } from "@/lib/api";
import { fileToAvatarDataUrl } from "@/lib/image";
import Logo from "@/assets/icons/logo.svg?react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import IconInput from "@/components/ui/IconInput";
import PasswordInput from "@/components/ui/PasswordInput";
import Text from "@/components/ui/Text";

const features = [
  { icon: IoHeartOutline, text: "Save the movies and shows you love" },
  { icon: IoTimeOutline, text: "Build a watch-later list you can return to" },
  { icon: IoFilmOutline, text: "Search the full TMDB catalog" },
];

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

type Mode = "login" | "register";

const copy: Record<Mode, { heading: string; submit: string; busy: string }> = {
  login: {
    heading: "Sign in to CineScope",
    submit: "Sign in",
    busy: "Signing in...",
  },
  register: {
    heading: "Create your account",
    submit: "Create account",
    busy: "Creating account...",
  },
};

/** CINESCOPE wordmark + logo, matching the navbar lockup. */
const Brand = () => (
  <div className="flex items-center max-lg:justify-center gap-3">
    <span className="size-10 lg:size-15">
      <Logo className="h-full w-full" aria-label="CineScope logo" />
    </span>
    <span className="text-4xl lg:text-6xl">
      <span className="font-outfit font-bold">CINE</span>
      <span className="text-orange">SCOPE</span>
    </span>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  // Login identifier (email or username) — separate from the signup email.
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when an account still needs its email confirmed (fresh signup, or a
  // login attempt that came back EMAIL_NOT_VERIFIED) — swaps in the "check
  // your inbox" panel. Holds whatever the user identified themselves with.
  const [pendingIdentifier, setPendingIdentifier] = useState<string | null>(
    null,
  );
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  // Offered after a login attempt fails with INVALID_CREDENTIALS — the moment
  // a reset is actually useful.
  const [showForgotLink, setShowForgotLink] = useState(false);
  // Swaps in the "email me a reset link" panel.
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotState, setForgotState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  // Signed in → into the app.
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setShowForgotLink(false);
  };

  const openForgot = () => {
    setForgotOpen(true);
    setForgotState("idle");
    setError(null);
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setError(null);
    setShowForgotLink(false);
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-picking the same file after removing it.
    event.target.value = "";
    if (!file) return;
    try {
      setAvatar(await fileToAvatarDataUrl(file));
      setError(null);
    } catch {
      setError("That file couldn't be read as an image. Try another one.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setShowForgotLink(false);
    try {
      if (mode === "register") {
        await signUp({
          email,
          password,
          firstName,
          lastName,
          username,
          avatar: avatar ?? undefined,
        });
        setPendingIdentifier(email);
        setResendState("idle");
      } else {
        // Success populates `user`; the effect above redirects.
        await signIn(identifier, password);
      }
    } catch (err) {
      const { code, message } = getApiError(err);
      if (code === "EMAIL_NOT_VERIFIED") {
        setPendingIdentifier(identifier);
        setResendState("idle");
      } else {
        setError(message ?? "Something went wrong. Try again.");
        // A failed password is the moment a reset link is actually useful.
        setShowForgotLink(code === "INVALID_CREDENTIALS");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (forgotState !== "idle") return;
    setForgotState("sending");
    setError(null);
    try {
      await requestPasswordReset(identifier);
      setForgotState("sent");
    } catch {
      setForgotState("idle");
      setError("The reset email couldn't be sent. Try again.");
    }
  };

  const handleResend = async () => {
    if (!pendingIdentifier || resendState === "sending") return;
    setResendState("sending");
    try {
      await resendVerification(pendingIdentifier);
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  };

  const handleGoogleCredential = async (credential: string | undefined) => {
    if (!credential) {
      setError("Google sign-in failed. Try again.");
      return;
    }
    setError(null);
    try {
      await signInWithGoogle(credential);
    } catch (err) {
      setError(getApiError(err).message ?? "Google sign-in failed. Try again.");
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Hero panel — cinematic brand side, shown on large screens. */}
      <aside className="relative hidden w-4/7 min-w-0 flex-col justify-between items-center overflow-hidden bg-secondary-dark p-12 lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(252,71,71,0.18),transparent_55%)]" />
          <span className="absolute -left-20 top-1/3 size-72 rounded-full bg-orange/20 blur-3xl" />
          <span className="absolute -bottom-24 right-0 size-96 rounded-full bg-orange/10 blur-3xl" />
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center gap-6">
          <Brand />
          <h2 className="font-outfitLight text-4xl leading-tight text-white">
            Your cinema, organized.
          </h2>
          <Text className="max-w-sm text-white/60">
            Track what you love and what&apos;s next — favorites and
            watch-later, all in one place.
          </Text>
          <ul className="self-start flex flex-col gap-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange/15 text-orange">
                  <Icon className="text-lg" />
                </span>
                <Text className="text-white/60">{text}</Text>
              </li>
            ))}
          </ul>
        </div>

        <Text size="sm" className="relative text-gray">
          Powered by TMDB
        </Text>
      </aside>

      {/* Form panel — auth lives here. */}
      <main className="flex w-full min-w-0 items-center justify-center px-6 py-10 lg:w-3/7">
        <div className="flex w-full max-w-100 flex-col gap-6">
          <div className="lg:hidden mb-10">
            <Brand />
          </div>

          {pendingIdentifier ? (
            <div className="flex flex-col gap-4" data-test-id="verify-notice">
              <span className="flex size-14 items-center justify-center rounded-full bg-orange/10 text-orange">
                <IoMailOutline className="text-2xl" />
              </span>
              <Heading as="h1" size="md">
                Check your inbox
              </Heading>
              <Text className="text-gray">
                We sent a verification link to{" "}
                <span className="text-white">
                  {pendingIdentifier.includes("@")
                    ? pendingIdentifier
                    : `the email on the account "${pendingIdentifier}"`}
                </span>
                . Open it to activate your account, then sign in.
              </Text>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  data-test-id="resend-verification"
                  className="text-sm text-orange underline-offset-4 hover:underline disabled:opacity-60"
                  onClick={handleResend}
                  disabled={resendState !== "idle"}
                >
                  {resendState === "sent"
                    ? "Email sent!"
                    : resendState === "sending"
                      ? "Sending..."
                      : "Resend email"}
                </button>
                <button
                  type="button"
                  data-test-id="back-to-login"
                  className="text-sm text-gray underline-offset-4 hover:underline"
                  onClick={() => {
                    setPendingIdentifier(null);
                    switchMode("login");
                  }}
                >
                  Back to sign in
                </button>
              </div>
            </div>
          ) : forgotOpen ? (
            <div className="flex flex-col gap-4" data-test-id="forgot-panel">
              <span className="flex size-14 items-center justify-center rounded-full bg-orange/10 text-orange">
                <IoKeyOutline className="text-2xl" />
              </span>
              <Heading as="h1" size="md">
                Reset your password
              </Heading>
              {forgotState === "sent" ? (
                <Text className="text-gray" data-test-id="forgot-sent">
                  If an account exists for{" "}
                  <span className="text-white">{identifier}</span>, a reset link
                  is on its way. Open it to choose a new password.
                </Text>
              ) : (
                <>
                  <Text className="text-gray">
                    Enter your email or username and we&apos;ll send you a link
                    to choose a new password.
                  </Text>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={handleForgotSubmit}
                    data-test-id="forgot-form"
                  >
                    <IconInput
                      icon={IoMailOutline}
                      id="forgot-identifier"
                      type="text"
                      required
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Email or username"
                      aria-label="Email or username"
                      data-test-id="forgot-identifier"
                    />
                    <Button
                      type="submit"
                      data-test-id="forgot-submit"
                      className="w-full py-3"
                      disabled={forgotState !== "idle"}
                    >
                      {forgotState === "sending"
                        ? "Sending..."
                        : "Email me a reset link"}
                    </Button>
                    {error && (
                      <Text
                        size="sm"
                        className="text-red-400"
                        data-test-id="auth-error"
                      >
                        {error}
                      </Text>
                    )}
                  </form>
                </>
              )}
              <button
                type="button"
                data-test-id="forgot-back"
                className="self-start text-sm text-gray underline-offset-4 hover:underline"
                onClick={closeForgot}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col max-lg:hidden gap-2">
                <Heading as="h1" size="md" data-test-id="login-heading">
                  {copy[mode].heading}
                </Heading>
                <Text className="text-gray">
                  Save your favorites and build a watch-later list.
                </Text>
              </div>

              {googleClientId && (
                <>
                  <div
                    className="flex justify-center"
                    data-test-id="google-signin"
                  >
                    <GoogleLogin
                      theme="filled_black"
                      size="large"
                      text={
                        mode === "register" ? "signup_with" : "continue_with"
                      }
                      onSuccess={(response) =>
                        handleGoogleCredential(response.credential)
                      }
                      onError={() =>
                        setError("Google sign-in failed. Try again.")
                      }
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-gray">
                    <span className="h-px flex-1 bg-white/10" />
                    or
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                </>
              )}

              <form
                className="flex flex-col gap-3"
                onSubmit={handleSubmit}
                data-test-id="auth-form"
              >
                {mode === "register" && (
                  <>
                    {/* Optional avatar — resized client-side to a small square. */}
                    <div className="flex items-center gap-4">
                      <label
                        htmlFor="register-avatar"
                        className="group relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-main-dark ring-1 ring-white/10 transition hover:ring-orange"
                      >
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="Avatar preview"
                            className="size-full object-cover"
                          />
                        ) : (
                          <IoCameraOutline className="text-2xl text-gray transition group-hover:text-orange" />
                        )}
                        <input
                          id="register-avatar"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          data-test-id="auth-avatar"
                          onChange={handleAvatarChange}
                        />
                      </label>
                      <div className="flex flex-col">
                        <Text size="sm">Profile photo (optional)</Text>
                        {avatar ? (
                          <button
                            type="button"
                            data-test-id="auth-avatar-remove"
                            className="self-start text-sm text-orange underline-offset-4 hover:underline"
                            onClick={() => setAvatar(null)}
                          >
                            Remove photo
                          </button>
                        ) : (
                          <Text size="sm" className="text-gray">
                            JPG, PNG or WebP.
                          </Text>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 max-sm:flex-col">
                      <IconInput
                        icon={IoPersonOutline}
                        id="register-first-name"
                        type="text"
                        required
                        maxLength={50}
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        aria-label="First name"
                        data-test-id="auth-first-name"
                      />
                      <IconInput
                        icon={IoPersonOutline}
                        id="register-last-name"
                        type="text"
                        required
                        maxLength={50}
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        aria-label="Last name"
                        data-test-id="auth-last-name"
                      />
                    </div>

                    <IconInput
                      icon={IoAtOutline}
                      id="register-username"
                      type="text"
                      required
                      pattern="[A-Za-z0-9._]{3,30}"
                      title="3-30 characters: letters, numbers, dots and underscores"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      aria-label="Username"
                      data-test-id="auth-username"
                    />
                  </>
                )}

                {mode === "register" ? (
                  <IconInput
                    icon={IoMailOutline}
                    id="register-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-label="Email address"
                    data-test-id="auth-email"
                  />
                ) : (
                  <IconInput
                    icon={IoMailOutline}
                    id="login-identifier"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email or username"
                    aria-label="Email or username"
                    data-test-id="auth-identifier"
                  />
                )}

                <PasswordInput
                  id="login-password"
                  required
                  minLength={8}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "register"
                      ? "Password (min. 8 characters)"
                      : "Password"
                  }
                  aria-label="Password"
                  data-test-id="auth-password"
                />

                {mode === "register" && (
                  <PasswordInput
                    id="register-confirm-password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    aria-label="Confirm password"
                    data-test-id="auth-confirm-password"
                  />
                )}

                <Button
                  type="submit"
                  data-test-id="auth-submit"
                  className="w-full py-3"
                  disabled={submitting}
                >
                  {submitting ? copy[mode].busy : copy[mode].submit}
                </Button>
                {error && (
                  <div className="flex flex-col gap-1">
                    <Text
                      size="sm"
                      className="text-red-400"
                      data-test-id="auth-error"
                    >
                      {error}
                    </Text>
                    {showForgotLink && (
                      <button
                        type="button"
                        data-test-id="forgot-password"
                        className="self-start text-sm text-orange underline-offset-4 hover:underline"
                        onClick={openForgot}
                      >
                        Forgot your password?
                      </button>
                    )}
                  </div>
                )}
              </form>

              <Text size="sm" className="text-gray">
                {mode === "login" ? (
                  <>
                    New to CineScope?{" "}
                    <button
                      type="button"
                      data-test-id="switch-to-register"
                      className="text-orange underline-offset-4 hover:underline"
                      onClick={() => switchMode("register")}
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      data-test-id="switch-to-login"
                      className="text-orange underline-offset-4 hover:underline"
                      onClick={() => switchMode("login")}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </Text>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;
