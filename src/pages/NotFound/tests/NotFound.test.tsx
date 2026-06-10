import { screen } from "@testing-library/react";

import NotFound from "@/pages/NotFound";
import { renderWithProviders } from "@/tests/test-utils";

describe("NotFound Page", () => {
  test("renders the 404 message", () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
