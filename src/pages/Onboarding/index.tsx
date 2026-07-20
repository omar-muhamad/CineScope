import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { authClient } from "@/lib/auth-client";
import Brand from "@/components/ui/Brand";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import NameStep from "./NameStep";
import UsernameStep from "./UsernameStep";
import AvatarStep from "./AvatarStep";

const STEPS = [
  {
    title: "What's your name?",
    subtitle: "It's how you'll appear around CineScope.",
  },
  {
    title: "Pick a username",
    subtitle: "A unique handle for your account.",
  },
  {
    title: "Add a profile photo",
    subtitle: "Optional — you can always add one later from your profile.",
  },
];

/**
 * Mandatory first-run wizard: the OnboardingGate routes every signed-in user
 * here until onboardingComplete is set (by AvatarStep, the final step). Each
 * step commits immediately, so a closed tab resumes where it left off.
 */
const Onboarding = () => {
  const navigate = useNavigate();
  const { refetchSession } = useAuth();
  // The raw session user (not the useAuth mapping): the Better Auth `name`
  // field is needed to prefill Google sign-ups, which arrive with name/image
  // but no firstName/lastName.
  const { data } = authClient.useSession();
  const raw = data?.user;

  const [step, setStep] = useState(0);

  // RequireAuth only renders this page with a resolved session.
  if (!raw) return null;

  const nameParts = (raw.name ?? "").trim().split(/\s+/).filter(Boolean);
  const initialFirstName = raw.firstName ?? nameParts[0] ?? "";
  const initialLastName = raw.lastName ?? nameParts.slice(1).join(" ");

  const finish = async () => {
    // Refresh the session store before navigating so the OnboardingGate sees
    // onboardingComplete — if the navigate still races the refetch, the
    // gate's "complete && on /onboarding" branch self-heals.
    await refetchSession();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-100 flex-col gap-8">
        <Brand />

        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-2"
            aria-label={`Step ${step + 1} of ${STEPS.length}`}
          >
            {STEPS.map((s, index) => (
              <span
                key={s.title}
                className={`h-1.5 flex-1 rounded-full transition ${
                  index <= step ? "bg-orange" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <Text size="sm" className="text-gray">
            Step {step + 1} of {STEPS.length}
          </Text>
        </div>

        <div className="flex flex-col gap-2">
          <Heading as="h1" size="md" data-test-id="onboarding-heading">
            {STEPS[step].title}
          </Heading>
          <Text className="text-gray">{STEPS[step].subtitle}</Text>
        </div>

        {step === 0 && (
          <NameStep
            initialFirstName={initialFirstName}
            initialLastName={initialLastName}
            onDone={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <UsernameStep
            initialUsername={raw.username ?? ""}
            onDone={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <AvatarStep initialAvatar={raw.image ?? null} onDone={finish} />
        )}

        {step > 0 && (
          <button
            type="button"
            className="self-start text-sm text-gray underline-offset-4 hover:underline"
            onClick={() => setStep(step - 1)}
            data-test-id="onboarding-back"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
