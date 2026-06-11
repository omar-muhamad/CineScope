import { FC, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { IconType } from "react-icons";
import { IoClose, IoChevronDown } from "react-icons/io5";

import { useAuth } from "@/auth/useAuth";
import Button from "../ui/Button";
import NavSearch from "../common/NavSearch";

/** A category link inside a navbar dropdown (no icon of its own). */
export type NavChildLink = {
  id: number;
  title: string;
  path: string;
};

export type NavLinkItem = {
  id: number;
  title: string;
  path: string;
  icon: IconType;
  /** Hide this link from the navbar until the user is signed in. */
  requiresAuth?: boolean;
  /** Browse categories shown as a dropdown (desktop) / accordion (mobile). */
  children?: NavChildLink[];
};

type MobileMenuProps = {
  id: string;
  isOpen: boolean;
  navLinks: NavLinkItem[];
  isLogged: boolean;
  onClose: () => void;
};

/**
 * A single mobile nav entry. Links with `children` render as an expandable
 * accordion (the title toggles its category links); plain links navigate and
 * close the menu directly.
 */
const MobileNavItem: FC<{ link: NavLinkItem; onClose: () => void }> = ({
  link,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = link.icon;

  if (!link.children) {
    return (
      <NavLink
        to={link.path}
        onClick={onClose}
        aria-label={`Link to ${link.title} page`}
        className="flex items-center gap-3 capitalize text-xl text-gray hover:text-white aria-[current=page]:text-white"
      >
        <Icon className="size-5" />
        <span>{link.title}</span>
      </NavLink>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={`${link.title} menu`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-3 capitalize text-xl text-gray hover:text-white"
      >
        <Icon className="size-5" />
        <span>{link.title}</span>
        <IoChevronDown
          className={`ml-auto text-base transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="ml-8 flex flex-col gap-3">
          {link.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.path}
              onClick={onClose}
              className="capitalize text-gray hover:text-white aria-[current=page]:text-white"
            >
              {child.title}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileMenu: FC<MobileMenuProps> = ({
  id,
  isOpen,
  navLinks,
  isLogged,
  onClose,
}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async () => {
    onClose();
    if (isLogged) {
      await signOut();
      navigate("/", { replace: true });
    } else {
      navigate("/login");
    }
  };

  // Rendered through a portal into <body> so the fixed full-screen overlay
  // escapes the navbar's containing block. The nav uses `backdrop-blur`
  // (backdrop-filter), which makes it the containing block for fixed
  // descendants — without the portal the menu would be clipped to the navbar.
  return createPortal(
    <div
      className={`md:hidden fixed inset-0 z-50 overflow-hidden ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        id={id}
        className={`absolute top-0 right-0 h-full w-3/4 max-w-xs bg-secondary-dark/90 backdrop-blur-sm shadow-lg p-6 flex flex-col gap-6 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="self-end text-2xl text-gray hover:text-white"
        >
          <IoClose />
        </button>
        <NavSearch variant="block" onSearch={onClose} />
        <nav className="flex flex-col gap-4" data-testid="mobile-nav-links">
          {navLinks.map((link) => (
            <MobileNavItem key={link.id} link={link} onClose={onClose} />
          ))}
        </nav>
        <Button className="w-full py-2 mt-auto text-white" onClick={handleAuth}>
          {isLogged ? "Logout" : "Login"}
        </Button>
      </div>
    </div>,
    document.body,
  );
};

export default MobileMenu;
