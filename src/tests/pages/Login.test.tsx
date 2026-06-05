import Login from "@/pages/Login";
import { store } from "@/redux/store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";


describe("Login Page", () => {
  test("renders Login Page should match the screenshot", () => {
    const login = render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );

    expect(login).toMatchSnapshot();
  });
});
