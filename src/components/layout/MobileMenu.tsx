import { FC } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { IconType } from "react-icons";
import { IoClose } from "react-icons/io5";

import { AppDispatch } from "@/redux/store";
import { logout } from "@/redux/user/userSlice";
import Button from "../ui/Button";
import NavSearch from "../common/NavSearch";

export type NavLinkItem = {
  id: number;
  title: string;
  path: string;
  icon: IconType;
};

type MobileMenuProps = {
  id: string;
  isOpen: boolean;
  navLinks: NavLinkItem[];
  isLogged: boolean;
  onClose: () => void;
};

const MobileMenu: FC<MobileMenuProps> = ({
  id,
  isOpen,
  navLinks,
  isLogged,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleAuth = async () => {
    onClose();
    if (isLogged) {
      await dispatch(logout());
      navigate("/", { replace: true });
    } else {
      navigate("/login");
    }
  };

  return (
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
        className={`absolute top-0 right-0 h-full w-3/4 max-w-xs bg-secondary-dark shadow-lg p-6 flex flex-col gap-6 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="self-end text-3xl text-gray hover:text-white"
        >
          <IoClose />
        </button>
        <NavSearch variant="block" onSearch={onClose} />
        <nav className="flex flex-col gap-4" data-testid="mobile-nav-links">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.id}
                to={link.path}
                onClick={onClose}
                aria-label={`Link to ${link.title} page`}
                className="flex items-center gap-3 capitalize text-xl text-gray hover:text-white aria-[current=page]:text-white"
              >
                <Icon className="size-5" />
                <span>{link.title}</span>
              </NavLink>
            );
          })}
        </nav>
        <Button className="w-full py-1 mt-auto" onClick={handleAuth}>
          {isLogged ? "Logout" : "Login"}
        </Button>
      </div>
    </div>
  );
};

export default MobileMenu;
