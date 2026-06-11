import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Navbar from "@/components/layout/Navbar";
import { renderWithProviders } from "@/tests/test-utils";

describe("Navbar dropdowns", () => {
  // Scope queries to the desktop nav so we don't collide with the mobile menu,
  // which renders the same labels through a portal.
  const desktopNav = () => within(screen.getByTestId("nav-links"));

  it("hides the Movies category links until the trigger is clicked", () => {
    renderWithProviders(<Navbar />);
    const nav = desktopNav();
    expect(nav.queryByRole("menuitem", { name: "now playing" })).toBeNull();
  });

  it("opens the Movies dropdown and links each category to its route", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);
    const nav = desktopNav();

    await user.click(nav.getByRole("button", { name: /movies menu/i }));

    expect(nav.getByRole("menuitem", { name: "trending" })).toHaveAttribute(
      "href",
      "/movies/trending",
    );
    expect(nav.getByRole("menuitem", { name: "now playing" })).toHaveAttribute(
      "href",
      "/movies/now-playing",
    );
    expect(nav.getByRole("menuitem", { name: "popular" })).toHaveAttribute(
      "href",
      "/movies/popular",
    );
  });

  it("closes the dropdown on Escape and on an outside click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);
    const nav = desktopNav();
    const trigger = nav.getByRole("button", { name: /movies menu/i });

    await user.click(trigger);
    expect(nav.getByRole("menuitem", { name: "upcoming" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(nav.queryByRole("menuitem", { name: "upcoming" })).toBeNull();

    await user.click(trigger);
    expect(nav.getByRole("menuitem", { name: "upcoming" })).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(nav.queryByRole("menuitem", { name: "upcoming" })).toBeNull();
  });
});
