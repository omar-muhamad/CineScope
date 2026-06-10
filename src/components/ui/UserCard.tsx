import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";

import { useAuth } from "@/auth/useAuth";
import Button from "./Button";
import Heading from "./Heading";
import Text from "./Text";

const UserCard: FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isLogged = Boolean(user);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email;
  const firstName = displayName?.split(" ")[0];
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined) ||
    "";

  return (
    <div className="user-card absolute z-50 top-full right-2 mt-2 w-60 origin-top-right rounded-lg border border-white/10 bg-secondary-dark p-2 shadow-2xl shadow-black/50 animate-dropdown">
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
            {isLogged ? `Hi, ${firstName}!` : "Hi, User!"}
          </Heading>
          <Text size="sm" className="truncate text-gray">
            {isLogged ? user?.email : "You're signed out"}
          </Text>
        </div>
      </div>

      {isLogged ? (
        <Button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2"
        >
          <IoLogOutOutline className="text-xl" />
          Logout
        </Button>
      ) : (
        <Button className="mt-2 w-full py-2" onClick={() => navigate("/login")}>
          Login
        </Button>
      )}
    </div>
  );
};

export default UserCard;
