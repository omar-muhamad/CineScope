import { FormEvent, useState } from "react";
import { IoAtOutline } from "react-icons/io5";

import { authClient } from "@/lib/auth-client";
import Button from "@/components/ui/Button";
import IconInput from "@/components/ui/IconInput";
import Text from "@/components/ui/Text";

type UsernameStepProps = {
  initialUsername: string;
  onDone: () => void;
};

/** Step 2 — required unique handle. The server pre-checks uniqueness and
 *  answers USERNAME_TAKEN (see server/auth.ts databaseHooks). */
const UsernameStep = ({ initialUsername, onDone }: UsernameStepProps) => {
  const [username, setUsername] = useState(initialUsername);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: updateError } = await authClient.updateUser({ username });
    setBusy(false);
    if (updateError) {
      setError(
        updateError.code === "USERNAME_TAKEN"
          ? "That username is already taken. Try another."
          : (updateError.message ??
              "That username can't be used. Try another."),
      );
      return;
    }
    onDone();
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={handleSubmit}
      data-test-id="onboarding-username-form"
    >
      <IconInput
        icon={IoAtOutline}
        id="onboarding-username"
        type="text"
        required
        pattern="[A-Za-z0-9._]{3,30}"
        title="3-30 characters: letters, numbers, dots and underscores"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        aria-label="Username"
        data-test-id="onboarding-username"
      />
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

export default UsernameStep;
