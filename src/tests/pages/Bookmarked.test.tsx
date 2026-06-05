
import Bookmarked from "@/pages/Bookmarked";
import { store } from "@/redux/store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";


describe("Bookmarked Page", () => {
  test("renders Bookmarked Page should match the screenshot", () => {
    const bookmarked = render(
      <Provider store={store}>
        <Router>
          <Bookmarked />
        </Router>
      </Provider>
    );

    expect(bookmarked).toMatchSnapshot();
  });
});
