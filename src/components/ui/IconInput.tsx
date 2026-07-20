import { InputHTMLAttributes } from "react";
import { IconType } from "react-icons";

export const inputClass =
  "w-full rounded-md bg-main-dark py-3 pl-11 text-sm text-white outline-hidden ring-1 ring-white/10 transition focus:ring-2 focus:ring-orange placeholder:text-gray caret-orange";

export type IconInputProps = {
  icon: IconType;
  children?: never;
} & InputHTMLAttributes<HTMLInputElement>;

/** Input with the auth forms' standard leading icon treatment. */
const IconInput = ({ icon: Icon, ...props }: IconInputProps) => (
  <div className="relative min-w-0 flex-1">
    <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray" />
    <input {...props} className={`${inputClass} pr-4`} />
  </div>
);

export default IconInput;
