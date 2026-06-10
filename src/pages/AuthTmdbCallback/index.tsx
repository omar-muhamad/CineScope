import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { AiOutlineExclamationCircle } from "react-icons/ai";

import { useAuth } from "@/auth/useAuth";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";

const cardClass =
  "bg-secondary-dark w-full max-w-[500px] p-10 flex flex-col justify-center items-center gap-6 rounded-xl text-center";

/**
 * Landing route for TMDB's approval redirect. TMDB returns here with a
 * `request_token` (and `approved`/`denied`); we exchange the token for a
 * session, link it to the signed-in Google user, then send them home.
 */
const AuthTmdbCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { google, tmdb, error, connectTmdb } = useAuth();

  const requestToken = params.get("request_token");
  const denied = params.get("denied") === "true";
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Need a Google identity to link the session to, an approved token, and no denial.
    if (google && requestToken && !denied) {
      connectTmdb(requestToken);
    }
  }, [connectTmdb, google, requestToken, denied]);

  useEffect(() => {
    if (tmdb) {
      const timer = setTimeout(() => navigate("/", { replace: true }), 1500);
      return () => clearTimeout(timer);
    }
  }, [tmdb, navigate]);

  const renderBody = () => {
    if (!google) {
      return (
        <>
          <AiOutlineExclamationCircle className="text-6xl text-orange" />
          <Heading as="h1" className="mt-0">
            Sign in with Google first
          </Heading>
          <Link to="/login" className="text-orange hover:text-white">
            Back to login
          </Link>
        </>
      );
    }
    if (denied || (!requestToken && !tmdb)) {
      return (
        <>
          <AiOutlineExclamationCircle className="text-6xl text-orange" />
          <Heading as="h1" className="mt-0">
            TMDB access was not granted
          </Heading>
          <Link to="/login" className="text-orange hover:text-white">
            Try again
          </Link>
        </>
      );
    }
    if (tmdb) {
      return (
        <>
          <IoIosCheckmarkCircleOutline className="text-6xl text-orange" />
          <Heading as="h1" className="mt-0">
            TMDB account connected!
          </Heading>
          <Text>Taking you back...</Text>
        </>
      );
    }
    if (error) {
      return (
        <>
          <AiOutlineExclamationCircle className="text-6xl text-orange" />
          <Heading as="h1" className="mt-0">
            Couldn't connect TMDB
          </Heading>
          <Text className="text-red-400">{error}</Text>
          <Link to="/login" className="text-orange hover:text-white">
            Try again
          </Link>
        </>
      );
    }
    return (
      <>
        <div className="w-14 h-14 border-[5px] border-t-orange rounded-full border-[#ffffff90] animate-spin" />
        <Heading as="h1" className="mt-0">
          Connecting your TMDB account...
        </Heading>
      </>
    );
  };

  return (
    <div className="w-screen h-[80vh] px-6 md:px-0 flex justify-center items-center">
      <div className={cardClass}>{renderBody()}</div>
    </div>
  );
};

export default AuthTmdbCallback;
