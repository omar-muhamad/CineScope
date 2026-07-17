import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoHourglassOutline,
} from "react-icons/io5";

import { verifyEmail } from "@/api/auth";
import Logo from "@/assets/icons/logo.svg?react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";

type Status = "verifying" | "success" | "error";

const content: Record<
  Status,
  { icon: typeof IoHourglassOutline; heading: string; body: string }
> = {
  verifying: {
    icon: IoHourglassOutline,
    heading: "Verifying your email...",
    body: "Hold on a second while we confirm your address.",
  },
  success: {
    icon: IoCheckmarkCircleOutline,
    heading: "Email verified!",
    body: "Your account is active. Sign in to start saving favorites.",
  },
  error: {
    icon: IoCloseCircleOutline,
    heading: "This link didn't work",
    body: "The verification link is invalid or has expired. Sign in to request a fresh one.",
  },
};

/** Landing page for the emailed verification link (/verify-email?token=...). */
const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  // Verification tokens are single-use — guard against effect re-runs
  // consuming the token twice and mislabeling a successful verify as failed.
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    let active = true;
    verifyEmail(token)
      .then(() => active && setStatus("success"))
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [token]);

  const { icon: Icon, heading, body } = content[status];

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6">
      <div
        className="flex w-full max-w-100 flex-col items-center gap-4 text-center"
        data-test-id="verify-email-panel"
      >
        <span className="size-12">
          <Logo className="h-full w-full" aria-label="CineScope logo" />
        </span>
        <span
          className={`flex size-14 items-center justify-center rounded-full ${
            status === "error"
              ? "bg-red-400/10 text-red-400"
              : "bg-orange/10 text-orange"
          }`}
        >
          <Icon className="text-3xl" />
        </span>
        <Heading as="h1" size="md" data-test-id="verify-email-heading">
          {heading}
        </Heading>
        <Text className="text-gray">{body}</Text>
        {status !== "verifying" && (
          <Link to="/login" className="w-full max-w-60">
            <Button className="w-full py-3" data-test-id="verify-email-cta">
              Go to sign in
            </Button>
          </Link>
        )}
      </div>
    </main>
  );
};

export default VerifyEmail;
