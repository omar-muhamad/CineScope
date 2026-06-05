import Tv from "@/pages/Tv";
import { store } from "@/redux/store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";


describe("Tv Page", () => {
  test("renders Tv Page should match the screenshot", () => {
    const tv = render(
      <Provider store={store}>
        <Router>
          <Tv />
        </Router>
      </Provider>
    );

    expect(tv).toMatchSnapshot();
  });
});
