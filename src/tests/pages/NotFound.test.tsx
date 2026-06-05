import NotFound from "@/pages/NotFound";
import { store } from "@/redux/store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";


describe("NotFound Page", () => {
  test("renders NotFound Page should match the screenshot", () => {
    const notFound = render(
      <Provider store={store}>
        <Router>
          <NotFound />
        </Router>
      </Provider>
    );

    expect(notFound).toMatchSnapshot();
  });
});
