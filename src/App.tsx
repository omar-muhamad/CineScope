import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Tv from "./pages/Tv";
import MediaList from "./pages/MediaList";
import Search from "./pages/Search";
import Details from "./pages/Details";
import WatchOnline from "./pages/WatchOnline";
import Favorites from "./pages/Favorites";
import WatchLater from "./pages/WatchLater";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ScrollToTop from "./components/common/ScrollToTop";

const AUTH_ROUTES = ["/login"];

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
            element={
              <MediaList
                mediaType="movie"
                category="trending"
                title="Trending Movies"
              />
            }
          />
          <Route
            path="/movies/now-playing"
            element={
              <MediaList
                mediaType="movie"
                category="now_playing"
                title="Now Playing"
              />
            }
          />
          <Route
            path="/movies/upcoming"
            element={
              <MediaList
                mediaType="movie"
                category="upcoming"
                title="Upcoming Movies"
              />
            }
          />
          <Route
            path="/movies/top-rated"
            element={
              <MediaList
                mediaType="movie"
                category="top_rated"
                title="Top Rated Movies"
              />
            }
          />
          <Route path="/tv/popular" element={<Tv />} />
          <Route
            path="/tv/trending"
            element={
              <MediaList
                mediaType="tv"
                category="trending"
                title="Trending TV Shows"
              />
            }
          />
          <Route
            path="/tv/on-tv"
            element={
              <MediaList mediaType="tv" category="on_the_air" title="On TV" />
            }
          />
          <Route
            path="/tv/top-rated"
            element={
              <MediaList
                mediaType="tv"
                category="top_rated"
                title="Top Rated TV Shows"
              />
            }
          />
          <Route path="/search" element={<Search />} />
          <Route path="/watch/:media_type/:id" element={<WatchOnline />} />
          <Route path="/:media_type/:id" element={<Details />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/watch-later" element={<WatchLater />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
