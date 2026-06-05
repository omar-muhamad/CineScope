import Details from "@/pages/Details";
import { store } from "@/redux/store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";


describe("Details Page", () => {
  test("renders Details Page should match the screenshot", () => {
    const details = render(
      <Provider store={store}>
        <Router>
          <Details />
        </Router>
      </Provider>
    );

    expect(details).toMatchSnapshot();
  });
});
