import { Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Tv from "./pages/Tv";
import Search from "./pages/Search";
import Details from "./pages/Details";
import WatchOnline from "./pages/WatchOnline";
import Bookmarked from "./pages/Bookmarked";
import WatchLater from "./pages/WatchLater";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AuthTmdbCallback from "./pages/AuthTmdbCallback";
import RequireAuth from "./components/common/RequireAuth";
import ErrorBoundary from "./components/common/ErrorBoundary";

const AUTH_ROUTES = ["/login", "/auth/tmdb/callback"];

function App() {
  const { pathname } = useLocation();
  return (
    <div className="font-outfitLight min-h-screen w-full  flex bg-main-dark text-white flex-col mx-auto relative">
      {!AUTH_ROUTES.includes(pathname) && (
        <header className="sticky top-0 z-50">
          <Navbar />
        </header>
      )}
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/tv" element={<Tv />} />
          <Route path="/search" element={<Search />} />
          <Route path="/watch/:media_type/:id" element={<WatchOnline />} />
          <Route path="/:media_type/:id" element={<Details />} />
          <Route
            path="/bookmarked"
            element={
              <RequireAuth requireTmdb>
                <Bookmarked />
              </RequireAuth>
            }
          />
          <Route
            path="/watch-later"
            element={
              <RequireAuth requireTmdb>
                <WatchLater />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/tmdb/callback" element={<AuthTmdbCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
