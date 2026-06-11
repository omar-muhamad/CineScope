import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  IoMailOutline,
  IoHeartOutline,
  IoTimeOutline,
  IoFilmOutline,
} from "react-icons/io5";

import { useAuth } from "@/auth/useAuth";
import Logo from "@/assets/icons/logo.svg?react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";

const features = [
  { icon: IoHeartOutline, text: "Save the movies and shows you love" },
  { icon: IoTimeOutline, text: "Build a watch-later list you can return to" },
  { icon: IoFilmOutline, text: "Search the full TMDB catalog" },
];

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
  const { user, signIn, signInWithEmail } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Signed in (after the OAuth/magic-link redirect resolves) → into the app.
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      // Redirects to Google; the app reloads on return and `user` populates.
      await signIn();
    } catch {
      setSigningIn(false);
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await signInWithEmail(email);
      // Only reached on a confirmed send — the provider rethrows Supabase errors.
      setSentTo(email);
    } catch {
      setError("We couldn't send the link. Check the address and try again.");
    } finally {
      setSending(false);
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

          {sentTo ? (
            <div className="flex flex-col gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-orange/10 text-orange">
                <IoMailOutline className="text-2xl" />
              </span>
              <Heading as="h1" size="md">
                Check your inbox
              </Heading>
              <Text className="text-gray">
                We sent a sign-in link to{" "}
                <span className="text-white">{sentTo}</span>. Open it on this
                device to finish signing in.
              </Text>
              <button
                type="button"
                data-test-id="use-different-email"
                className="self-start text-sm text-orange underline-offset-4 hover:underline"
                onClick={() => {
                  setSentTo(null);
                  setEmail("");
                }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col max-lg:hidden gap-2">
                <Heading as="h1" size="md" data-test-id="login-heading">
                  Sign in to CineScope
                </Heading>
                <Text className="text-gray">
                  Save your favorites and build a watch-later list.
                </Text>
              </div>

              <button
                type="button"
                data-test-id="google-signin-button"
                onClick={handleSignIn}
                disabled={signingIn}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-main-dark py-3 text-white transition-colors hover:border-white/25 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FcGoogle className="rounded-full bg-white text-xl" />
                <span>
                  {signingIn
                    ? "Redirecting to Google..."
                    : "Continue with Google"}
                </span>
              </button>

              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-gray">
                <span className="h-px flex-1 bg-white/10" />
                or
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form
                className="flex flex-col gap-3"
                onSubmit={handleEmailSubmit}
                data-test-id="magic-link-form"
              >
                <div className="relative">
                  <IoMailOutline className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    aria-label="Email address"
                    data-test-id="magic-link-email"
                    className="w-full rounded-md bg-main-dark py-3 pl-11 pr-4 text-sm text-white outline-hidden ring-1 ring-white/10 transition focus:ring-2 focus:ring-orange placeholder:text-gray caret-orange"
                  />
                </div>
                <Button
                  type="submit"
                  data-test-id="magic-link-button"
                  className="w-full py-3"
                  disabled={sending}
                >
                  {sending ? "Sending link..." : "Send magic link"}
                </Button>
                {error && (
                  <Text
                    size="sm"
                    className="text-red-400"
                    data-test-id="magic-link-error"
                  >
                    {error}
                  </Text>
                )}
              </form>

              <Text size="sm" className="text-gray">
                No password needed — we&apos;ll email you a secure sign-in link.
              </Text>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;
