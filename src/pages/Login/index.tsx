import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "@/auth/useAuth";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";

const cardClass =
  "bg-secondary-dark w-full max-w-[500px] p-10 flex flex-col justify-center gap-6 rounded-xl";

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
    <div className="w-screen h-screen px-6 md:px-0 flex justify-center items-center">
      <div className={cardClass}>
        <Heading as="h1" className="-mt-1" data-test-id="login-heading">
          Sign in to CineScope
        </Heading>

        {sentTo ? (
          <>
            <Text data-test-id="magic-link-sent">
              Check your inbox — we sent a sign-in link to{" "}
              <span className="text-orange">{sentTo}</span>. Open it on this
              device to finish signing in.
            </Text>
            <Button
              data-test-id="use-different-email"
              className="w-full py-3"
              onClick={() => {
                setSentTo(null);
                setEmail("");
              }}
            >
              Use a different email
            </Button>
          </>
        ) : (
          <>
            <Text>
              Sign in to save your favorite movies and build your watch-later
              list.
            </Text>

            <Button
              data-test-id="google-signin-button"
              className="w-full py-4 flex items-center justify-center gap-3"
              onClick={handleSignIn}
              disabled={signingIn}
            >
              <FcGoogle className="text-2xl bg-white rounded-full" />
              {signingIn ? "Redirecting to Google..." : "Sign in with Google"}
            </Button>

            <div className="flex items-center gap-3 text-gray text-sm">
              <span className="h-px flex-1 bg-gray/30" />
              or
              <span className="h-px flex-1 bg-gray/30" />
            </div>

            <form
              className="flex flex-col gap-3"
              onSubmit={handleEmailSubmit}
              data-test-id="magic-link-form"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                data-test-id="magic-link-email"
                className="w-full rounded-md bg-main-dark p-4 text-sm outline-hidden caret-orange placeholder:text-gray focus:ring-1 focus:ring-orange"
              />
              <Button
                type="submit"
                data-test-id="magic-link-button"
                className="w-full py-4"
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
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
