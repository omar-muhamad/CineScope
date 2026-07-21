import { FormEvent, useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  IoMailOutline,
  IoHeartOutline,
  IoTimeOutline,
  IoFilmOutline,
  IoLogoGoogle,
} from "react-icons/io5";

import { useAuth } from "@/auth/useAuth";
import { authClient } from "@/lib/auth-client";
import Brand from "@/components/ui/Brand";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import IconInput from "@/components/ui/IconInput";
import Text from "@/components/ui/Text";

const features = [
  { icon: IoHeartOutline, text: "Save the movies and shows you love" },
  { icon: IoTimeOutline, text: "Build a watch-later list you can return to" },
  { icon: IoFilmOutline, text: "Search the full TMDB catalog" },
];

/** Seconds the resend button stays disabled after a send — be polite to the
 *  rate limiter (5 sends / 15 min per IP). */
const RESEND_COOLDOWN_S = 30;

type SendState = "idle" | "sending" | "sent";

const Login = () => {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();

  const [email, setEmail] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  // A failed magic-link verification (expired/invalid token) is a full page
  // load back to /login?error=... — surface it above the form from the start.
  const [error, setError] = useState<string | null>(() =>
    params.get("error")
      ? "That sign-in link is invalid or has expired. Enter your email to get a new one."
      : null,
  );
  const [cooldown, setCooldown] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(cooldownTimer.current), []);

  // Signed in → into the app (OnboardingGate routes incomplete profiles).
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const sendMagicLink = async () => {
    setSendState("sending");
    setError(null);
    const { error: sendError } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/", // where the emailed link lands after verifying
      errorCallbackURL: "/login", // failures come back here with ?error=
    });
    if (sendError) {
      setSendState("idle");
      setError(
        sendError.status === 429
          ? "Too many sign-in emails requested — wait a few minutes and try again."
          : (sendError.message ?? "The email couldn't be sent. Try again."),
      );
      return;
    }
    setSendState("sent");
    setCooldown(true);
    cooldownTimer.current = setTimeout(
      () => setCooldown(false),
      RESEND_COOLDOWN_S * 1000,
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendState === "sending") return;
    await sendMagicLink();
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleBusy(true);
    // Full-page redirect to Google and back — code after this rarely runs.
    const { error: googleError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/login",
    });
    if (googleError) {
      setGoogleBusy(false);
      setError(googleError.message ?? "Google sign-in failed. Try again.");
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

          {sendState === "sent" ? (
            <div className="flex flex-col gap-4" data-test-id="magic-sent">
              <span className="flex size-14 items-center justify-center rounded-full bg-orange/10 text-orange">
                <IoMailOutline className="text-2xl" />
              </span>
              <Heading as="h1" size="md">
                Check your inbox
              </Heading>
              <Text className="text-gray">
                We sent a sign-in link to{" "}
                <span className="text-white">{email}</span>. It signs you in on
                the device that opens it and expires in 10 minutes.
              </Text>
              {error && (
                <Text
                  size="sm"
                  className="text-red-400"
                  data-test-id="auth-error"
                >
                  {error}
                </Text>
              )}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  data-test-id="magic-resend"
                  className="text-sm text-orange underline-offset-4 hover:underline disabled:opacity-60"
                  onClick={sendMagicLink}
                  disabled={cooldown}
                >
                  {cooldown ? "Email sent!" : "Resend email"}
                </button>
                <button
                  type="button"
                  data-test-id="magic-change-email"
                  className="text-sm text-gray underline-offset-4 hover:underline"
                  onClick={() => {
                    setSendState("idle");
                    setError(null);
                  }}
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col max-lg:hidden gap-2">
                <Heading as="h1" size="md" data-test-id="login-heading">
                  Sign in to CineScope
                </Heading>
                <Text className="text-gray">
                  No password needed — use Google or an emailed sign-in link.
                </Text>
              </div>

              <button
                type="button"
                data-test-id="google-signin"
                className="flex w-full items-center justify-center gap-3 rounded-md bg-white py-3 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-60"
                onClick={handleGoogle}
                disabled={googleBusy}
              >
                <IoLogoGoogle className="text-lg" />
                {googleBusy
                  ? "Redirecting to Google..."
                  : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-gray">
                <span className="h-px flex-1 bg-white/10" />
                or
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form
                className="flex flex-col gap-3"
                onSubmit={handleSubmit}
                data-test-id="auth-form"
              >
                <IconInput
                  icon={IoMailOutline}
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  data-test-id="auth-email"
                />
                <Button
                  type="submit"
                  data-test-id="auth-submit"
                  className="w-full py-3"
                  disabled={sendState === "sending"}
                >
                  {sendState === "sending"
                    ? "Sending..."
                    : "Email me a sign-in link"}
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
                First time here? The same link signs you up — we&apos;ll help
                you set up your profile right after.
              </Text>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;
