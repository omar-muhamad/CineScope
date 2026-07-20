import { FormEvent, useState } from "react";
import { IoPersonOutline } from "react-icons/io5";

import { authClient } from "@/lib/auth-client";
import Button from "@/components/ui/Button";
import IconInput from "@/components/ui/IconInput";
import Text from "@/components/ui/Text";

type NameStepProps = {
  initialFirstName: string;
  initialLastName: string;
  onDone: () => void;
};

/** Step 1 — required name. Commits immediately so onboarding is resumable. */
const NameStep = ({
  initialFirstName,
  initialLastName,
  onDone,
}: NameStepProps) => {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const { error: updateError } = await authClient.updateUser({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      // Keep Better Auth's core display name in sync with the split fields.
      name: `${trimmedFirst} ${trimmedLast}`.trim(),
    });
    setBusy(false);
    if (updateError) {
      setError(
        updateError.message ?? "Your name couldn't be saved. Try again.",
      );
      return;
    }
    onDone();
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={handleSubmit}
      data-test-id="onboarding-name-form"
    >
      <div className="flex gap-3 max-sm:flex-col">
        <IconInput
          icon={IoPersonOutline}
          id="onboarding-first-name"
          type="text"
          required
          maxLength={50}
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          aria-label="First name"
          data-test-id="onboarding-first-name"
        />
        <IconInput
          icon={IoPersonOutline}
          id="onboarding-last-name"
          type="text"
          required
          maxLength={50}
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          aria-label="Last name"
          data-test-id="onboarding-last-name"
        />
      </div>
      <Button
        type="submit"
        className="w-full py-3"
        disabled={busy}
        data-test-id="onboarding-continue"
      >
        {busy ? "Saving..." : "Continue"}
      </Button>
      {error && (
        <Text
          size="sm"
          className="text-red-400"
          data-test-id="onboarding-error"
        >
          {error}
        </Text>
      )}
    </form>
  );
};

export default NameStep;
