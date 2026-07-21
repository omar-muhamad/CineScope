import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router } from "react-router-dom";

import App from "./App.tsx";
import { queryClient } from "./lib/queryClient";
import "./index.css";

// No auth provider needed: Better Auth's useSession is backed by a shared
// module-level store (see src/lib/auth-client.ts).
ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Router>
      <App />
    </Router>
  </QueryClientProvider>,
);
