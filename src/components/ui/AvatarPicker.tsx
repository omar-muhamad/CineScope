import { ChangeEvent, useRef, useState } from "react";
import { IoCameraOutline } from "react-icons/io5";

import { fileToAvatarDataUrl } from "@/lib/image";
import Text from "./Text";

// `accept` is only a picker hint — gate before decoding so a mispicked
// video/huge file doesn't get object-URL'd and synchronously decoded.
const MAX_FILE_BYTES = 20 * 1024 * 1024;

type AvatarPickerProps = {
  /** id for the file input (label htmlFor) — must be unique per page. */
  id: string;
  /** Current avatar: a data URL, a remote photo URL, or null for none. */
  value: string | null;
  onChange: (dataUrl: string | null) => void;
};

/**
 * Circular avatar picker used by Onboarding and Profile (extracted from the
 * old signup form). Picked files are center-cropped and downscaled to a small
 * data URL (see fileToAvatarDataUrl) — the avatar is stored inline in the
 * user row, not in object storage.
 */
const AvatarPicker = ({ id, value, onChange }: AvatarPickerProps) => {
  const [readError, setReadError] = useState<string | null>(null);
  // Two rapid picks race their decodes; only the latest may win onChange.
  const pickToken = useRef(0);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-picking the same file after removing it.
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setReadError("That file isn't an image. Pick a JPG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setReadError("That image is too large. Pick one under 20MB.");
      return;
    }
    const token = ++pickToken.current;
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      if (token !== pickToken.current) return;
      onChange(dataUrl);
      setReadError(null);
    } catch {
      if (token !== pickToken.current) return;
      setReadError("That file couldn't be read as an image. Try another one.");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-4">
        <label
          htmlFor={id}
          className="group relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-main-dark ring-1 ring-white/10 transition hover:ring-orange focus-within:ring-2 focus-within:ring-orange"
        >
          {value ? (
            <img
              src={value}
              alt="Avatar preview"
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
          ) : (
            <IoCameraOutline className="text-2xl text-gray transition group-hover:text-orange" />
          )}
          <input
            id={id}
            type="file"
            accept="image/*"
            aria-label={value ? "Change profile photo" : "Add profile photo"}
            className="sr-only"
            data-test-id="avatar-input"
            onChange={handleFileChange}
          />
        </label>
        <div className="flex flex-col">
          <Text size="sm">Profile photo (optional)</Text>
          {value ? (
            <button
              type="button"
              data-test-id="avatar-remove"
              className="self-start text-sm text-orange underline-offset-4 hover:underline"
              onClick={() => onChange(null)}
            >
              Remove photo
            </button>
          ) : (
            <Text size="sm" className="text-gray">
              JPG, PNG or WebP.
            </Text>
          )}
        </div>
      </div>
      {readError && (
        <Text size="sm" className="text-red-400" data-test-id="avatar-error">
          {readError}
        </Text>
      )}
    </div>
  );
};

export default AvatarPicker;
