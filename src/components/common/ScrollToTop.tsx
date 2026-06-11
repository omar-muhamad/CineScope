import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the window scroll to the top whenever the route path changes.
 *
 * BrowserRouter (the declarative router) does not restore scroll on its own —
 * without this, navigating from a scrolled-down list into a detail page (or
 * between sibling category pages) lands the user mid-page. Keyed on pathname
 * only, so query-string changes (e.g. `?page=2`) don't trigger a reset here;
 * pagination handles its own scroll. Renders nothing.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
