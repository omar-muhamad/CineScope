import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoKeyOutline,
} from "react-icons/io5";

import { resetPassword } from "@/api/auth";
import { getApiError } from "@/lib/api";
import Logo from "@/assets/icons/logo.svg?react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import PasswordInput from "@/components/ui/PasswordInput";
import Text from "@/components/ui/Text";

type Status = "form" | "success" | "invalid";

/** Landing page for the emailed reset link (/reset-password?token=...). */
const ResetPassword = () => {
  const [params, setParams] = useSearchParams();
  // Captured once — the URL is scrubbed right after so the still-valid token
  // (up to an hour of life) isn't recoverable from history on a shared
  // machine.
  const [token] = useState(() => params.get("token"));

  useEffect(() => {
    if (!params.has("token")) return;
    const scrubbed = new URLSearchParams(params);
    scrubbed.delete("token");
    setParams(scrubbed, { replace: true });
  }, [params, setParams]);

  const [status, setStatus] = useState<Status>(token ? "form" : "invalid");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setStatus("success");
    } catch (err) {
      const { code, message } = getApiError(err);
      // A dead token can't recover by retrying — send them back for a new link.
      if (code === "INVALID_TOKEN") {
        setStatus("invalid");
      } else {
        setError(message ?? "Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6">
      <div
        className="flex w-full max-w-100 flex-col items-center gap-4 text-center"
        data-test-id="reset-password-panel"
      >
        <span className="size-12">
          <Logo className="h-full w-full" aria-label="CineScope logo" />
        </span>
        <span
          className={`flex size-14 items-center justify-center rounded-full ${
            status === "invalid"
              ? "bg-red-400/10 text-red-400"
              : "bg-orange/10 text-orange"
          }`}
        >
          {status === "form" && <IoKeyOutline className="text-3xl" />}
          {status === "success" && (
            <IoCheckmarkCircleOutline className="text-3xl" />
          )}
          {status === "invalid" && (
            <IoCloseCircleOutline className="text-3xl" />
          )}
        </span>

        {status === "form" && (
          <>
            <Heading as="h1" size="md" data-test-id="reset-password-heading">
              Choose a new password
            </Heading>
            <Text className="text-gray">
              You&apos;ll be signed out everywhere and can sign back in with the
              new password.
            </Text>
            <form
              className="flex w-full flex-col gap-3 text-left"
              onSubmit={handleSubmit}
              data-test-id="reset-password-form"
            >
              <PasswordInput
                id="reset-password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                aria-label="New password"
                data-test-id="reset-password-input"
              />
              <PasswordInput
                id="reset-confirm-password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                aria-label="Confirm new password"
                data-test-id="reset-confirm-password-input"
              />
              <Button
                type="submit"
                data-test-id="reset-password-submit"
                className="w-full py-3"
                disabled={submitting}
              >
                {submitting ? "Updating password..." : "Update password"}
              </Button>
              {error && (
                <Text
                  size="sm"
                  className="text-red-400"
                  data-test-id="reset-password-error"
                >
                  {error}
                </Text>
              )}
            </form>
          </>
        )}

        {status === "success" && (
          <>
            <Heading as="h1" size="md" data-test-id="reset-password-heading">
              Password updated!
            </Heading>
            <Text className="text-gray">
              Your new password is set. Sign in to get back to your lists.
            </Text>
          </>
        )}

        {status === "invalid" && (
          <>
            <Heading as="h1" size="md" data-test-id="reset-password-heading">
              This link didn&apos;t work
            </Heading>
            <Text className="text-gray">
              The reset link is invalid or has expired. Head back to sign in to
              request a fresh one.
            </Text>
          </>
        )}

        {status !== "form" && (
          <Link to="/login" className="w-full max-w-60">
            <Button className="w-full py-3" data-test-id="reset-password-cta">
              Go to sign in
            </Button>
          </Link>
        )}
      </div>
    </main>
  );
};

export default ResetPassword;
