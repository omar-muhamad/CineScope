import { useState } from "react";
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoLockClosedOutline,
} from "react-icons/io5";

import { inputClass, type IconInputProps } from "@/components/ui/IconInput";

/** Password input with the lock icon and a show/hide visibility toggle. */
const PasswordInput = (props: Omit<IconInputProps, "icon" | "type">) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative min-w-0 flex-1">
      <IoLockClosedOutline className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray" />
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${inputClass} pr-11`}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg text-gray transition hover:text-white"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <IoEyeOffOutline /> : <IoEyeOutline />}
      </button>
    </div>
  );
};

export default PasswordInput;
