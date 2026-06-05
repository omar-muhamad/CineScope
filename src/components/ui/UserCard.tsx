import { FC } from "react";
import { UserData, logoutUser } from "@/redux/user/userSlice";
import Button from "./Button";
import Heading from "./Heading";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";

type UserCardProps = { user: UserData | null; isLogged: boolean };

const UserCard: FC<UserCardProps> = ({ user, isLogged }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const handleLogout = () => {
    const session_id = localStorage.getItem("session_id");
    if (session_id) {
      dispatch(logoutUser({ session_id }));
      localStorage.removeItem("session_id");
      navigate(0);
    }
  };
  return (
    <div className="user-card absolute z-50 md:bottom-10 md:left-[102px] bg-secondary-dark rounded-lg h-32 w-44 px-4 flex items-center justify-center">
      <div className="w-full text-center">
        <Heading as="h3" className="mt-0 text-lg">
          {isLogged ? `Hi, ${user?.name}!` : "Hi, User!"}
        </Heading>
        <Button
          className="w-full py-1 mt-4"
          onClick={isLogged ? handleLogout : () => navigate("/login")}
        >
          {isLogged ? "Logout" : "Login"}
        </Button>
      </div>
    </div>
  );
};
export default UserCard;
