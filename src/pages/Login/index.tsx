import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { SiThemoviedatabase } from "react-icons/si";

import { useAuth } from "@/auth/useAuth";
import { createRequestToken, redirectToTmdbApproval } from "@/lib/tmdbAuth";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";

const cardClass =
  "bg-secondary-dark w-full max-w-[500px] p-10 flex flex-col justify-center gap-6 rounded-xl";

const Login = () => {
  const navigate = useNavigate();
  const { google, tmdb, error, signIn, clearError } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  // Fully set up (Google + TMDB linked) → send the user into the app.
  useEffect(() => {
    if (google && tmdb) {
      const timer = setTimeout(() => navigate("/", { replace: true }), 1500);
      return () => clearTimeout(timer);
    }
  }, [google, tmdb, navigate]);

  const handleConnectTmdb = async () => {
    clearError();
    setConnecting(true);
    try {
      const requestToken = await createRequestToken();
      redirectToTmdbApproval(requestToken); // navigates away to themoviedb.org
    } catch {
      setConnecting(false);
    }
  };

  return (
    <div className="w-screen h-screen px-6 md:px-0 flex justify-center items-center">
      {/* Step 1 — sign in with Google */}
      {!google && (
        <div className={cardClass}>
          <Heading as="h1" className="-mt-1" data-test-id="login-heading">
            Sign in to CineScope
          </Heading>
          <Text>
            Sign in with Google to save your favorite movies and watch-later
            list to your own TMDB account.
          </Text>
          {googleConfigured ? (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    signIn(credentialResponse.credential);
                  }
                }}
                onError={() => {
                  /* GoogleLogin renders its own failure state */
                }}
                theme="filled_black"
                shape="pill"
                text="signin_with"
              />
            </div>
          ) : (
            <Text className="text-orange">
              Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID.
            </Text>
          )}
        </div>
      )}

      {/* Step 2 — connect a TMDB account */}
      {google && !tmdb && (
        <div className={cardClass}>
          <div className="flex items-center gap-3">
            <SiThemoviedatabase className="text-4xl text-orange shrink-0" />
            <Heading as="h1" className="mt-0">
              Connect TMDB
            </Heading>
          </div>
          <Text>
            Hi {google.name.split(" ")[0]}! Connect your TMDB account to sync
            your bookmarks and watch-later list. You'll approve access on
            themoviedb.org and come right back.
          </Text>
          {error && <Text className="text-red-400">{error}</Text>}
          <Button
            data-test-id="connect-tmdb-button"
            className="w-full py-4"
            onClick={handleConnectTmdb}
            disabled={connecting}
          >
            {connecting ? "Redirecting to TMDB..." : "Connect TMDB account"}
          </Button>
          <button
            type="button"
            className="text-gray hover:text-white text-sm"
            onClick={() => navigate("/", { replace: true })}
          >
            Maybe later
          </button>
        </div>
      )}

      {/* Step 3 — all set */}
      {google && tmdb && (
        <div className={cardClass}>
          <div className="flex flex-col items-center justify-center gap-6">
            <IoIosCheckmarkCircleOutline className="text-6xl text-orange" />
            <Heading as="h1" className="text-center">
              You're all set, {tmdb.name || google.name}!
            </Heading>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
