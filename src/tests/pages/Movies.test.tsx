import Movies from "@/pages/Movies";
import { store } from "@/redux/store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";

describe("Movies Page", () => {
  test("renders Movies Page should match the screenshot", () => {
    const movies = render(
      <Provider store={store}>
        <Router>
          <Movies />
        </Router>
      </Provider>
    );

    expect(movies).toMatchSnapshot();
  });
});
