import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, RootState } from "@/redux/store";
import { logout } from "@/redux/user/userSlice";
import Button from "./Button";
import Heading from "./Heading";
import Text from "./Text";

const UserCard: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { google, tmdb } = useSelector((state: RootState) => state.user);
  const isLogged = Boolean(google);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/", { replace: true });
  };

  const firstName = google?.name?.split(" ")[0];

  return (
    <div className="user-card absolute z-50 top-full right-0 mt-2 bg-secondary-dark rounded-lg w-48 px-4 py-5 flex flex-col items-center justify-center gap-3">
      <div className="w-full text-center">
        <Heading as="h3" className="mt-0 text-lg">
          {isLogged ? `Hi, ${firstName}!` : "Hi, User!"}
        </Heading>
        {isLogged && !tmdb && (
          <button
            type="button"
            className="mt-1 text-xs text-orange hover:text-white"
            onClick={() => navigate("/login")}
          >
            Connect TMDB account
          </button>
        )}
        {isLogged && tmdb && (
          <Text className="mt-1 text-xs text-gray">TMDB: {tmdb.username}</Text>
        )}
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
