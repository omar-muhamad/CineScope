import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineExclamationCircle } from "react-icons/ai";

import { useAuth } from "@/auth/useAuth";
import Heading from "../ui/Heading";
import Text from "../ui/Text";
import Button from "../ui/Button";

type RequireAuthProps = {
  children: React.ReactNode;
};

type GateProps = {
  title: string;
  subtitle: string;
  actionLabel: string;
};

const Gate: FC<GateProps> = ({ title, subtitle, actionLabel }) => {
  const navigate = useNavigate();
  return (
    <div className="w-full flex justify-center items-center">
      <div className="bg-secondary-dark p-12 md:p-20 rounded-xl">
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <AiOutlineExclamationCircle className="text-6xl text-orange" />
          <Heading as="h1" className="mt-0">
            {title}
          </Heading>
          <Text className="max-w-xs">{subtitle}</Text>
          <Button className="mt-4 px-8 py-2" onClick={() => navigate("/login")}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

const RequireAuth: FC<RequireAuthProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Session rehydration (getSession) is async, so wait for it before deciding —
  // otherwise a logged-in user briefly sees the gate flash on a hard refresh.
  if (loading) return null;

  if (!user) {
    return (
      <Gate
        title="Page content is protected"
        subtitle="Please Login First"
        actionLabel="Login"
      />
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
