import { Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Tv from "./pages/Tv";
import Details from "./pages/Details";
import Bookmarked from "./pages/Bookmarked";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import RequireAuth from "./components/common/RequireAuth";
import ErrorBoundary from "./components/common/ErrorBoundary";

function App() {
  const { pathname } = useLocation();
  return (
    <div className="font-outfitLight min-h-screen w-full  flex bg-main-dark text-white flex-col md:flex-row md:mx-auto relative">
      {pathname !== "/login" && (
        <header className="md:h-[100svh] md:fixed z-50">
          <Navbar />
        </header>
      )}
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/tv" element={<Tv />} />
          <Route path="/:media_type/:id" element={<Details />} />
          <Route
            path="/bookmarked"
            element={
              <RequireAuth>
                <Bookmarked />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
