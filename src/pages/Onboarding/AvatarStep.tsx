import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/auth/useAuth";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/queryKeys";
import AvatarPicker from "@/components/ui/AvatarPicker";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";

type AvatarStepProps = {
  /** Google profile photo URL for Google sign-ups, else null. */
  initialAvatar: string | null;
  /** Awaited so the caller can refetch the session before navigating. */
  onDone: () => Promise<void>;
};

/** Step 3 — optional avatar. Both buttons flip onboardingComplete; Finish
 *  also persists an avatar change (upload or removal). */
const AvatarStep = ({ initialAvatar, onDone }: AvatarStepProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [busy, setBusy] = useState<"skip" | "finish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const complete = async (kind: "skip" | "finish") => {
    if (busy) return;
    setBusy(kind);
    setError(null);
    const changedAvatar = kind === "finish" && avatar !== initialAvatar;
    const { error: updateError } = await authClient.updateUser({
      // A change is either a data-URL upload → avatarData (kept out of
      // session payloads), or a removal → also clear the provider photo in
      // `image` so it doesn't resurface.
      ...(changedAvatar
        ? avatar
          ? { avatarData: avatar }
          : { avatarData: null, image: null }
        : {}),
      onboardingComplete: true,
    });
    if (updateError) {
      setBusy(null);
      setError(
        updateError.message ?? "Your profile couldn't be saved. Try again.",
      );
      return;
    }
    // Write through useAuth's avatar cache (staleTime Infinity — it won't
    // refetch on its own) so the new avatar shows as soon as we land home.
    if (changedAvatar && user) {
      queryClient.setQueryData(queryKeys.avatar(user.id), avatar);
    }
    await onDone();
  };

  return (
    <div className="flex flex-col gap-4" data-test-id="onboarding-avatar-step">
      <AvatarPicker
        id="onboarding-avatar"
        value={avatar}
        onChange={setAvatar}
      />
      <div className="flex gap-3">
        <Button
          type="button"
          className="flex-1 py-3"
          disabled={busy !== null}
          onClick={() => complete("finish")}
          data-test-id="onboarding-finish"
        >
          {busy === "finish" ? "Finishing..." : "Finish"}
        </Button>
        <button
          type="button"
          className="flex-1 rounded-md py-3 text-sm text-gray ring-1 ring-white/10 transition hover:text-white hover:ring-white/30 disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => complete("skip")}
          data-test-id="onboarding-skip"
        >
          {busy === "skip" ? "Finishing..." : "Skip for now"}
        </button>
      </div>
      {error && (
        <Text
          size="sm"
          className="text-red-400"
          data-test-id="onboarding-error"
        >
          {error}
        </Text>
      )}
    </div>
  );
};

export default AvatarStep;
