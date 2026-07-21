import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  IoAtOutline,
  IoLogOutOutline,
  IoMailOutline,
  IoPersonOutline,
} from "react-icons/io5";

import { useAuth } from "@/auth/useAuth";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/queryKeys";
import AvatarPicker from "@/components/ui/AvatarPicker";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import IconInput from "@/components/ui/IconInput";
import Text from "@/components/ui/Text";

/**
 * Edit everything the old signup form collected (minus passwords — the app is
 * passwordless): avatar, first/last name, username, and email. Email changes
 * go through Better Auth's verified change-email flow.
 */
const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut, refetchSession } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [newEmail, setNewEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  // RequireAuth only renders this page with a resolved, signed-in session.
  if (!user) return null;

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaveError(null);
    setSaveNotice(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const nameChanged =
      trimmedFirst !== (user.firstName ?? "") ||
      trimmedLast !== (user.lastName ?? "");

    // Send only what changed; recompute the core display name with the names.
    const payload: Partial<{
      firstName: string;
      lastName: string;
      name: string;
      username: string;
      image: string | null;
      avatarData: string | null;
    }> = {};
    if (nameChanged) {
      payload.firstName = trimmedFirst;
      payload.lastName = trimmedLast;
      payload.name = `${trimmedFirst} ${trimmedLast}`.trim();
    }
    if (username !== (user.username ?? "")) payload.username = username;
    if (avatar !== user.avatarUrl) {
      // The picker only yields a data-URL upload or null (removal). Uploads
      // go to avatarData (kept out of session payloads); a removal also
      // clears any provider photo in `image` so it doesn't resurface.
      payload.avatarData = avatar;
      if (!avatar) payload.image = null;
    }

    if (Object.keys(payload).length === 0) {
      setSaveNotice("Nothing to save — your profile is up to date.");
      return;
    }

    setSaving(true);
    const { error } = await authClient.updateUser(payload);
    setSaving(false);
    if (error) {
      setSaveError(
        error.code === "USERNAME_TAKEN"
          ? "That username is already taken. Try another."
          : (error.message ?? "Your changes couldn't be saved. Try again."),
      );
      return;
    }
    // Write the new avatar through the cache — useAuth's avatar query never
    // refetches on its own (staleTime Infinity).
    if ("avatarData" in payload) {
      queryClient.setQueryData(queryKeys.avatar(user.id), avatar);
    }
    await refetchSession();
    setSaveNotice("Saved!");
    noticeTimer.current = setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleChangeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (emailState === "sending") return;
    setEmailState("sending");
    setEmailError(null);
    const { error } = await authClient.changeEmail({
      newEmail,
      callbackURL: "/profile",
    });
    if (error) {
      setEmailState("idle");
      setEmailError(
        error.message ?? "The confirmation email couldn't be sent. Try again.",
      );
      return;
    }
    setEmailState("sent");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-10 px-6 py-10">
      <Heading as="h1" size="lg">
        Your profile
      </Heading>

      {/* Profile details */}
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSave}
        data-test-id="profile-form"
      >
        <AvatarPicker id="profile-avatar" value={avatar} onChange={setAvatar} />

        <div className="flex gap-3 max-sm:flex-col">
          <IconInput
            icon={IoPersonOutline}
            id="profile-first-name"
            type="text"
            required
            maxLength={50}
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            aria-label="First name"
            data-test-id="profile-first-name"
          />
          <IconInput
            icon={IoPersonOutline}
            id="profile-last-name"
            type="text"
            required
            maxLength={50}
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            aria-label="Last name"
            data-test-id="profile-last-name"
          />
        </div>

        <IconInput
          icon={IoAtOutline}
          id="profile-username"
          type="text"
          required
          pattern="[A-Za-z0-9._]{3,30}"
          title="3-30 characters: letters, numbers, dots and underscores"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          aria-label="Username"
          data-test-id="profile-username"
        />

        <Button
          type="submit"
          className="w-full py-3"
          disabled={saving}
          data-test-id="profile-save"
        >
          {saving ? "Saving..." : "Save changes"}
        </Button>
        {saveNotice && (
          <Text
            size="sm"
            className="text-green-400"
            data-test-id="profile-saved"
          >
            {saveNotice}
          </Text>
        )}
        {saveError && (
          <Text size="sm" className="text-red-400" data-test-id="profile-error">
            {saveError}
          </Text>
        )}
      </form>

      {/* Email */}
      <section className="flex flex-col gap-3">
        <Heading as="h2" size="sm">
          Email
        </Heading>
        <Text size="sm" className="text-gray">
          Signed in as <span className="text-white">{user.email}</span>. Your
          sign-in links go there.
        </Text>
        {emailState === "sent" ? (
          <Text size="sm" className="text-gray" data-test-id="email-pending">
            Confirmation link sent — check your email. Your address stays{" "}
            <span className="text-white">{user.email}</span> until the change is
            confirmed.
          </Text>
        ) : (
          <form
            className="flex gap-3 max-sm:flex-col"
            onSubmit={handleChangeEmail}
            data-test-id="email-form"
          >
            <IconInput
              icon={IoMailOutline}
              id="profile-new-email"
              type="email"
              required
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New email address"
              aria-label="New email address"
              data-test-id="profile-new-email"
            />
            <Button
              type="submit"
              className="shrink-0 px-4 py-3"
              disabled={emailState === "sending"}
              data-test-id="email-submit"
            >
              {emailState === "sending" ? "Sending..." : "Change email"}
            </Button>
          </form>
        )}
        {emailError && (
          <Text size="sm" className="text-red-400" data-test-id="email-error">
            {emailError}
          </Text>
        )}
      </section>

      {/* Session */}
      <section className="flex flex-col gap-3 border-t border-white/10 pt-6">
        <Button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 py-3"
          data-test-id="profile-signout"
        >
          <IoLogOutOutline className="text-xl" />
          Sign out
        </Button>
      </section>
    </main>
  );
};

export default Profile;
