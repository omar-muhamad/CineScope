import { FC, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { IoChevronDown } from "react-icons/io5";

import type { NavChildLink } from "./MobileMenu";

type NavDropdownProps = {
  /** Trigger label, e.g. "movies" or "tv shows". */
  title: string;
  items: NavChildLink[];
};

/**
 * Desktop navbar dropdown. The trigger is a button (it toggles the menu and
 * never navigates); the panel reuses the user-menu styling and the same
 * outside-click + Escape close behavior used elsewhere in the navbar.
 */
const NavDropdown: FC<NavDropdownProps> = ({ title, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${title} menu`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 capitalize text-2xl text-gray hover:text-white"
      >
        <span className="text-xl">{title}</span>
        <IoChevronDown
          className={`mt-1 text-base transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute z-50 top-full left-0 mt-2 w-56 origin-top-left rounded-lg border border-white/10 bg-secondary-dark p-2 shadow-2xl shadow-black/50 animate-dropdown"
        >
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 capitalize text-gray hover:bg-white/5 hover:text-white aria-[current=page]:text-white"
            >
              {item.title}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavDropdown;
