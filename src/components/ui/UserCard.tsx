import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import {
  IoHeartOutline,
  IoLogOutOutline,
  IoPersonOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { MdHistory } from "react-icons/md";

import { useAuth } from "@/auth/useAuth";
import Button from "./Button";
import Heading from "./Heading";
import Text from "./Text";

type UserCardProps = {
  /** Close the dropdown before navigating (wired by Navbar). */
  onClose?: () => void;
};

const UserCard: FC<UserCardProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isLogged = Boolean(user);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleNavigate = (path: string) => {
    onClose?.();
    navigate(path);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut();
    onClose?.();
    navigate("/", { replace: true });
  };

  // Google-created accounts may lack a username; password accounts always
  // have one. Email is the last-resort display handle.
  const greetName = user?.firstName || user?.username || user?.email;
  const avatarUrl = user?.avatarUrl ?? "";

  return (
    <div className="user-card absolute z-50 top-full right-0 mt-2 w-60 origin-top-right rounded-lg border border-white/10 bg-secondary-dark p-2 shadow-2xl shadow-black/50 animate-dropdown">
      <div className="flex items-center gap-3 px-3 py-3">
        <span className="size-10 shrink-0">
          {isLogged && avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="size-full rounded-full object-cover ring-2"
            />
          ) : (
            <FaUserCircle className="size-full text-gray" />
          )}
        </span>
        <div className="min-w-0">
          <Heading as="h3" size="sm" className="truncate leading-tight">
            {isLogged ? `Hi, ${greetName}!` : "Hi, User!"}
          </Heading>
          <Text size="sm" className="truncate text-gray">
            {isLogged ? user?.email : "You're signed out"}
          </Text>
        </div>
      </div>

      {isLogged ? (
        <>
          <button
            type="button"
            onClick={() => handleNavigate("/profile")}
            data-test-id="user-card-profile"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white transition hover:bg-white/5"
          >
            <IoPersonOutline className="text-lg text-gray" />
            Profile
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("/favorites")}
            data-test-id="user-card-favorites"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white transition hover:bg-white/5"
          >
            <IoHeartOutline className="text-lg text-gray" />
            Favorites
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("/watch-later")}
            data-test-id="user-card-watch-later"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white transition hover:bg-white/5"
          >
            <IoTimeOutline className="text-lg text-gray" />
            Watch Later
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("/history")}
            data-test-id="user-card-history"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white transition hover:bg-white/5"
          >
            <MdHistory className="text-lg text-gray" />
            Watch History
          </button>
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 disabled:opacity-60"
          >
            {loggingOut ? (
              <>
                <span
                  aria-hidden
                  className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
                />
                Logging out...
              </>
            ) : (
              <>
                <IoLogOutOutline className="text-xl" />
                Logout
              </>
            )}
          </Button>
        </>
      ) : (
        <Button className="mt-2 w-full py-2" onClick={() => navigate("/login")}>
          Login
        </Button>
      )}
    </div>
  );
};

export default UserCard;
