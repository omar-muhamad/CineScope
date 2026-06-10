import Favorites from "@/pages/Favorites";
import { store } from "@/redux/store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";

describe("Favorites Page", () => {
  test("renders Favorites Page should match the screenshot", () => {
    const favorites = render(
      <Provider store={store}>
        <Router>
          <Favorites />
        </Router>
      </Provider>,
    );

    expect(favorites).toMatchSnapshot();
  });
});
