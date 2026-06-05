import { FC, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { PiTelevisionSimpleFill } from "react-icons/pi";
import { IoBookmark } from "react-icons/io5";
import { RiFilmFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";

import { AppDispatch, RootState } from "@/redux/store";
import Logo from "@/assets/icons/logo.svg";
import { getUserDetails } from "@/redux/user/userSlice";
import UserCard from "../ui/UserCard";
import NavSearch from "../common/NavSearch";

const navLinks = [
  { id: 1, title: "movies", path: "/movies", icon: RiFilmFill },
  { id: 2, title: "tv", path: "/tv", icon: PiTelevisionSimpleFill },
  { id: 3, title: "bookmarked", path: "/bookmarked", icon: IoBookmark },
];

const Navbar: FC = () => {
  const [isUserIconClicked, setIsUserIconClicked] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const { loading, user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();

  const handleClick = () => {
    setIsUserIconClicked(!isUserIconClicked);
  };

  useEffect(() => {
    const session_id = localStorage.getItem("session_id");
    if (session_id) {
      setIsLogged(true);
      dispatch(getUserDetails({ session_id: session_id as string }));
    }
  }, [dispatch]);

  return (
    <nav className="relative flex justify-between items-center p-4 md:p-6 bg-secondary-dark">
      <div className="flex items-center gap-8">
        <NavLink
          to="/"
          aria-label="link to main page"
          className="flex items-center gap-4"
        >
          <span className="flex items-center justify-center size-7 md:size-8">
            <Logo />
          </span>
          <span className="text-lg md:text-xl">
            <span className="font-outfit font-bold">CINE</span>
            <span className="text-orange">SCOPE</span>
          </span>
        </NavLink>
        <div data-testid="nav-links" className="flex items-center gap-4">
          {navLinks.map((link) => (
            <NavLink
              to={link.path}
              className="flex items-center gap-1 capitalize text-2xl text-gray hover:text-white aria-[current=page]:text-white"
              area-label={`Link to ${link.title} page click to show more`}
            >
              <span className="text-xl">{link.title}</span>
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <NavSearch />
        <button
          className="size-8 shrink-0"
          type="button"
          aria-label="User image"
          onClick={handleClick}
        >
          {isLogged && !loading ? (
            <img
              className="h-full w-full rounded-full"
              src={`https://gravatar.com/avatar/${user?.gravatar}`}
              alt="User logo"
            />
          ) : (
            <FaUserCircle className="h-full w-full rounded-full text-orange hover:text-white" />
          )}
        </button>
      </div>
      {isUserIconClicked && <UserCard user={user} isLogged={isLogged} />}
    </nav>
  );
};
export default Navbar;
