import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import PageLayout from "@/components/layout/PageLayout";
import { store } from "@/redux/store";

describe("PageLayout", () => {
  it("renders loading state correctly", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <PageLayout loading={true}>
            <div>Test Child</div>
          </PageLayout>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByTestId("loading-component")).toBeInTheDocument();
  });

  it("renders children when not loading and no search query", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <PageLayout loading={false}>{<div>Test Child</div>}</PageLayout>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });
});
