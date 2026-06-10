import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "@/auth/useAuth";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";

const cardClass =
  "bg-secondary-dark w-full max-w-[500px] p-10 flex flex-col justify-center gap-6 rounded-xl";

const Login = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  // Signed in (after the OAuth redirect resolves) → send the user into the app.
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      // Redirects to Google; the app reloads on return and `user` populates.
      await signIn();
    } catch {
      setSigningIn(false);
    }
  };

  return (
    <div className="w-screen h-screen px-6 md:px-0 flex justify-center items-center">
      <div className={cardClass}>
        <Heading as="h1" className="-mt-1" data-test-id="login-heading">
          Sign in to CineScope
        </Heading>
        <Text>
          Sign in with Google to save your favorite movies and build your
          watch-later list.
        </Text>
        <Button
          data-test-id="google-signin-button"
          className="w-full py-4 flex items-center justify-center gap-3"
          onClick={handleSignIn}
          disabled={signingIn}
        >
          <FcGoogle className="text-2xl bg-white rounded-full" />
          {signingIn ? "Redirecting to Google..." : "Sign in with Google"}
        </Button>
      </div>
    </div>
  );
};

export default Login;
