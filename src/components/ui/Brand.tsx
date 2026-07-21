import Logo from "@/assets/icons/logo.svg?react";

/** CINESCOPE wordmark + logo, matching the navbar lockup. Used by the
 *  navbar-less full-screen flows (login, onboarding). */
const Brand = () => (
  <div className="flex items-center max-lg:justify-center gap-3">
    <span className="size-10 lg:size-15">
      <Logo className="h-full w-full" aria-label="CineScope logo" />
    </span>
    <span className="text-4xl lg:text-6xl">
      <span className="font-outfit font-bold">CINE</span>
      <span className="text-orange">SCOPE</span>
    </span>
  </div>
);

export default Brand;
