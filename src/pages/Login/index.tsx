import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  IoMailOutline,
  IoLockClosedOutline,
  IoHeartOutline,
  IoTimeOutline,
  IoFilmOutline,
} from "react-icons/io5";

import { useAuth } from "@/auth/useAuth";
import { resendVerification } from "@/api/auth";
import { getApiError } from "@/lib/api";
import Logo from "@/assets/icons/logo.svg?react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
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

const inputClass =
  "w-full rounded-md bg-main-dark py-3 pl-11 pr-4 text-sm text-white outline-hidden ring-1 ring-white/10 transition focus:ring-2 focus:ring-orange placeholder:text-gray caret-orange";

const Login = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when an account still needs its email confirmed (fresh signup, or a
  // login attempt that came back EMAIL_NOT_VERIFIED) — swaps in the "check
  // your inbox" panel.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">(
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
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "register") {
        await signUp(email, password);
        setPendingEmail(email);
        setResendState("idle");
      } else {
        // Success populates `user`; the effect above redirects.
        await signIn(email, password);
      }
    } catch (err) {
      const { code, message } = getApiError(err);
      if (code === "EMAIL_NOT_VERIFIED") {
        setPendingEmail(email);
        setResendState("idle");
      } else {
        setError(message ?? "Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail || resendState === "sending") return;
    setResendState("sending");
    try {
      await resendVerification(pendingEmail);
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

          {pendingEmail ? (
            <div className="flex flex-col gap-4" data-test-id="verify-notice">
              <span className="flex size-14 items-center justify-center rounded-full bg-orange/10 text-orange">
                <IoMailOutline className="text-2xl" />
              </span>
              <Heading as="h1" size="md">
                Check your inbox
              </Heading>
              <Text className="text-gray">
                We sent a verification link to{" "}
                <span className="text-white">{pendingEmail}</span>. Open it to
                activate your account, then sign in.
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
                    setPendingEmail(null);
                    switchMode("login");
                  }}
                >
                  Back to sign in
                </button>
              </div>
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
                <div className="relative">
                  <IoMailOutline className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    aria-label="Email address"
                    data-test-id="auth-email"
                    className={inputClass}
                  />
                </div>
                <div className="relative">
                  <IoLockClosedOutline className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={
                      mode === "register"
                        ? "Password (min. 8 characters)"
                        : "Password"
                    }
                    aria-label="Password"
                    data-test-id="auth-password"
                    className={inputClass}
                  />
                </div>
                <Button
                  type="submit"
                  data-test-id="auth-submit"
                  className="w-full py-3"
                  disabled={submitting}
                >
                  {submitting ? copy[mode].busy : copy[mode].submit}
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
