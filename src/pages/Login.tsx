import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";

import { AppDispatch, RootState } from "@/redux/store";
import { userLogin } from "@/redux/user/userSlice";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";

const Login = () => {
  const [isLogged, setIsLogged] = useState(false);
  const navigate = useNavigate();
  const { loading, session_id } = useSelector(
    (state: RootState) => state.user
  );

  const dispatch = useDispatch<AppDispatch>();

  const handleLogin = () => {
    dispatch(userLogin());
  };

  const handleNavigate = () => {
    setTimeout(() => navigate("/", { replace: true }), 3000);
  };

  useEffect(() => {
    if (localStorage.getItem("session_id")) {
      setIsLogged(true);
      handleNavigate();
    } else if (session_id) {
      localStorage.setItem("session_id", session_id);
      setIsLogged(true);
      handleNavigate();
    }
  }, [isLogged, session_id]);

  return (
    <div className="w-screen h-screen px-6 md:px-0 flex justify-center items-center">

      {loading && (
        <div className="bg-secondary-dark w-[500px] p-10 flex flex-col justify-center items-center gap-6 rounded-xl">
          <div className="w-14 h-14 border-[5px] border-t-orange rounded-full border-[#ffffff90] animate-spin" />
          <Heading as="h1" className="mt-0">Logging in...</Heading>
        </div>
      )}

      {!loading && !isLogged && (
        <div className="bg-secondary-dark w-[500px] p-10 flex flex-col justify-center gap-6 rounded-xl">
          <Heading as="h1" className="-mt-1" data-test-id='login-heading'>
            Login
          </Heading>
          <Text>
            Please click the login button,
            <br />
            To create a new session for you.
          </Text>
          <Button data-test-id='login-button' className="w-full py-4" onClick={handleLogin}>
            Login
          </Button>
        </div>
      )}

      {isLogged && loading === false ? (
        <div className="bg-secondary-dark w-[500px] p-10 flex flex-col justify-center gap-6 rounded-xl">
          <div className="flex flex-col items-center justify-center gap-6">
            <IoIosCheckmarkCircleOutline className="text-6xl text-orange" />
            <Heading as="h1" className="text-center">
              You are now logged in.
            </Heading>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default Login;
