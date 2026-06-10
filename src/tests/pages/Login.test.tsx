import Login from "@/pages/Login";
import { store } from "@/redux/store";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

describe("Login Page", () => {
  test("renders the Google sign-in step", () => {
    render(
      <GoogleOAuthProvider clientId="test-client-id">
        <Provider store={store}>
          <Router>
            <Login />
          </Router>
        </Provider>
      </GoogleOAuthProvider>,
    );

    expect(screen.getByText("Sign in to CineScope")).toBeInTheDocument();
  });
});
