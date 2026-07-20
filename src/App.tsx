import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Tv from "./pages/Tv";
import Search from "./pages/Search";
import Details from "./pages/Details";
import WatchOnline from "./pages/WatchOnline";
import Favorites from "./pages/Favorites";
import WatchLater from "./pages/WatchLater";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ScrollToTop from "./components/common/ScrollToTop";
import { OnboardingGate, RequireAuth } from "./auth/guards";

// Focused full-screen flows — no navbar. /profile is a normal in-app page.
const AUTH_ROUTES = ["/login", "/onboarding"];

function App() {
  const { pathname } = useLocation();
  return (
    <div className="font-outfitLight min-h-screen w-full  flex bg-main-dark text-white flex-col mx-auto relative">
      <ScrollToTop />
      {!AUTH_ROUTES.includes(pathname) && (
        <header className="sticky top-0 z-50">
          <Navbar />
        </header>
      )}
      <ErrorBoundary>
        <Routes>
          <Route element={<OnboardingGate />}>
            <Route path="/" element={<Home />} />
            {/* Bare section paths redirect to the Popular category page. */}
            <Route
              path="/movies"
              element={<Navigate to="/movies/popular" replace />}
            />
            <Route path="/tv" element={<Navigate to="/tv/popular" replace />} />
            <Route path="/movies/popular" element={<Movies />} />
            {/* Literal category paths — must stay static so numeric detail urls
                like /tv/456 fall through to the /:media_type/:id route below. */}
            <Route
              path="/movies/trending"
              element={<Movies category="trending" />}
            />
            <Route
              path="/movies/now-playing"
              element={<Movies category="now_playing" />}
            />
            <Route
              path="/movies/upcoming"
              element={<Movies category="upcoming" />}
            />
            <Route
              path="/movies/top-rated"
              element={<Movies category="top_rated" />}
            />
            <Route path="/tv/popular" element={<Tv />} />
            <Route path="/tv/trending" element={<Tv category="trending" />} />
            <Route path="/tv/on-tv" element={<Tv category="on_the_air" />} />
            <Route path="/tv/top-rated" element={<Tv category="top_rated" />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watch/:media_type/:id" element={<WatchOnline />} />
            <Route path="/:media_type/:id" element={<Details />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/watch-later" element={<WatchLater />} />
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
