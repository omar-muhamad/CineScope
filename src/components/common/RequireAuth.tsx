import { FC } from "react";
import { AiOutlineExclamationCircle } from "react-icons/ai";

import Heading from "../ui/Heading";

type RequireAuthProps = {
  children: React.ReactNode;
};

const RequireAuth: FC<RequireAuthProps> = ({ children }) => {
  const isUser = localStorage.getItem("session_id") ? true : false;
  return (
    <>
      {!isUser ? (
        <div className="w-full md:w-[calc(100%-8rem)] md:ml-32 md:pl-0 flex justify-center items-center">
          <div className="bg-secondary-dark p-20 rounded-xl">
            <div className="flex flex-col items-center justify-center">
              <AiOutlineExclamationCircle className="text-6xl text-orange" />
              <Heading as="h1" className="mt-0">
                Page content is protected
              </Heading>
              <Heading as="h3" className="mt-3">Please Login First</Heading>
            </div>
          </div>
        </div>
      ) : (
        children 
      )}
    </>
  );
};
export default RequireAuth;
