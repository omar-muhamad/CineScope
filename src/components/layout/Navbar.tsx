import { FC, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { PiTelevisionSimpleFill } from "react-icons/pi";
import { IoBookmark } from "react-icons/io5";
import { RiFilmFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";

import { AppDispatch, RootState } from "@/redux/store";
import NavIcon from "../ui/NavIcon";
import Logo from "@/assets/icons/logo.svg";
import { getUserDetails } from "@/redux/user/userSlice";
import UserCard from "../ui/UserCard";

const navLinks = [
  { id: 1, title: "movies", path: "/movies", icon: RiFilmFill },
  { id: 2, title: "tv", path: "/tv", icon: PiTelevisionSimpleFill },
  { id: 3, title: "bookmarked", path: "/bookmarked", icon: IoBookmark },
];

const Navbar: FC = () => {
  const [isUserIconClicked, setIsUserIconClicked] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const { loading, user } = useSelector(
    (state: RootState) => state.user
  );
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
    <nav className="relative h-[calc(100%-3rem)] flex md:flex-col justify-between items-center md:m-6 p-6 md:px-5 bg-secondary-dark md:rounded-2xl">
      <NavLink
        to="/"
        aria-label="link to main page"
        className="h-7 w-7 md:h-8 md:w-8"
      >
        <Logo />
      </NavLink>
      <div data-testid='nav-links' className="md:-mt-72 flex md:flex-col items-center gap-6">
        {navLinks.map((link) => (
          <NavIcon key={link.id} link={link} />
        ))}
      </div>
      <button
        className="h-10 w-10"
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
      {isUserIconClicked && <UserCard user={user} isLogged={isLogged} />}
    </nav>
  );
};
export default Navbar;
