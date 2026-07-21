import { FC, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { PiTelevisionSimpleFill } from "react-icons/pi";
import { IoHeart, IoMenu, IoClose, IoTime } from "react-icons/io5";
import { MdHistory } from "react-icons/md";
import { RiFilmFill } from "react-icons/ri";
import { FaUserCircle } from "react-icons/fa";

import { useAuth } from "@/auth/useAuth";
import Logo from "@/assets/icons/logo.svg?react";
import Skeleton from "../skeletons/Skeleton";
import UserCard from "../ui/UserCard";
import NavSearch from "../common/NavSearch";
import NavDropdown from "./NavDropdown";
import MobileMenu, { NavLinkItem } from "./MobileMenu";

const navLinks: NavLinkItem[] = [
  {
    id: 1,
    title: "movies",
    path: "/movies",
    icon: RiFilmFill,
    children: [
      { id: 11, title: "trending", path: "/movies/trending" },
      { id: 12, title: "popular", path: "/movies/popular" },
      { id: 13, title: "now playing", path: "/movies/now-playing" },
      { id: 14, title: "upcoming", path: "/movies/upcoming" },
      { id: 15, title: "top rated", path: "/movies/top-rated" },
    ],
  },
  {
    id: 2,
    title: "tv shows",
    path: "/tv",
    icon: PiTelevisionSimpleFill,
    children: [
      { id: 21, title: "trending", path: "/tv/trending" },
      { id: 22, title: "popular", path: "/tv/popular" },
      { id: 23, title: "on tv", path: "/tv/on-tv" },
      { id: 24, title: "top rated", path: "/tv/top-rated" },
    ],
  },
  {
    id: 3,
    title: "favorites",
    path: "/favorites",
    icon: IoHeart,
    requiresAuth: true,
  },
  {
    id: 4,
    title: "watch later",
    path: "/watch-later",
    icon: IoTime,
    requiresAuth: true,
  },
  {
    id: 5,
    title: "history",
    path: "/history",
    icon: MdHistory,
    requiresAuth: true,
  },
];

const MOBILE_MENU_ID = "mobile-menu";

const Navbar: FC = () => {
  const [isUserIconClicked, setIsUserIconClicked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();
  const isLogged = Boolean(user);
  // Personal links (favorites, watch later) live in the user card on desktop.
  // The mobile drawer keeps them (the card isn't reachable there), gated the
  // same way: while the initial session fetch is in flight they stay in the
  // list and render as skeleton slots, so a signed-in reload never flashes
  // the logged-out menu before flipping.
  const desktopLinks = navLinks.filter((link) => !link.requiresAuth);
  const mobileLinks = navLinks.filter(
    (link) => !link.requiresAuth || isLogged || loading,
  );
  const avatarUrl = user?.avatarUrl ?? "";

  const handleClick = () => {
    setIsUserIconClicked(!isUserIconClicked);
  };

  // Close the user card on outside click or Escape.
  useEffect(() => {
    if (!isUserIconClicked) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node))
        setIsUserIconClicked(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsUserIconClicked(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserIconClicked]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <nav className="relative flex justify-between items-center p-4 md:p-5 bg-secondary-dark/90 backdrop-blur-sm">
      <div className="flex items-center gap-8">
        <NavLink
          to="/"
          aria-label="link to main page"
          className="flex items-center gap-2"
        >
          <span className="size-5 md:size-6">
            <Logo className="w-full h-full" aria-label="CineScope logo" />
          </span>
          <span className="text-lg md:text-xl">
            <span className="font-outfit font-bold">CINE</span>
            <span className="text-orange">SCOPE</span>
          </span>
        </NavLink>
        <div
          data-testid="nav-links"
          className="hidden md:flex items-center gap-4"
        >
          {desktopLinks.map((link) =>
            link.children ? (
              <NavDropdown
                key={link.id}
                title={link.title}
                items={link.children}
              />
            ) : (
              <NavLink
                key={link.id}
                to={link.path}
                className="flex items-center gap-1 capitalize text-2xl text-gray hover:text-white aria-[current=page]:text-white"
                aria-label={`Link to ${link.title} page click to show more`}
              >
                <span className="text-xl">{link.title}</span>
              </NavLink>
            ),
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:block">
          <NavSearch />
        </div>
        {/* The trigger is a disclosure, not a menu button: UserCard is a plain
            panel of links and buttons with no menu semantics/arrow-key nav, so
            claiming aria-haspopup="menu" would promise interactions it
            doesn't have. */}
        <div ref={userMenuRef} className="relative hidden md:block">
          {loading ? (
            <Skeleton className="size-10 rounded-full ring-1 ring-white/10" />
          ) : (
            <button
              className="size-10 flex shrink-0 rounded-full"
              type="button"
              aria-label="Account menu"
              aria-expanded={isUserIconClicked}
              onClick={handleClick}
            >
              {isLogged && avatarUrl ? (
                <img
                  className="h-full w-full rounded-full object-cover"
                  src={avatarUrl}
                  alt="User avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <FaUserCircle className="h-full w-full rounded-full text-orange hover:text-white" />
              )}
            </button>
          )}
          {isUserIconClicked && (
            <UserCard onClose={() => setIsUserIconClicked(false)} />
          )}
        </div>
        <button
          className="md:hidden flex items-center justify-center size-8 shrink-0 text-2xl text-gray hover:text-white"
          type="button"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls={MOBILE_MENU_ID}
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <IoClose /> : <IoMenu />}
        </button>
      </div>
      <MobileMenu
        id={MOBILE_MENU_ID}
        isOpen={isMobileMenuOpen}
        navLinks={mobileLinks}
        isLogged={isLogged}
        loading={loading}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </nav>
  );
};
export default Navbar;
