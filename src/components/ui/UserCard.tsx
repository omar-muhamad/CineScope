import { FC } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import Button from "./Button";
import Heading from "./Heading";

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

  return (
    <div className="user-card absolute z-50 top-full right-2 mt-2 bg-secondary-dark rounded-lg w-48 px-4 py-5 flex flex-col items-center justify-center gap-3">
      <div className="w-full text-center">
        <Heading as="h3" className="mt-0 text-lg">
          {isLogged ? `Hi, ${firstName}!` : "Hi, User!"}
        </Heading>
      </div>
      <Button
        className="w-full py-1"
        onClick={isLogged ? handleLogout : () => navigate("/login")}
      >
        {isLogged ? "Logout" : "Login"}
      </Button>
    </div>
  );
};

export default UserCard;
