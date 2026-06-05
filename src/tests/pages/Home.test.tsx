import Home from "@/pages/Home";
import { store } from "@/redux/store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";


describe("Home Page", () => {
  test("renders Home Page should match the screenshot", () => {
    const home = render(
      <Provider store={store}>
        <Router>
          <Home />
        </Router>
      </Provider>
    );

    expect(home).toMatchSnapshot();
  });
});
