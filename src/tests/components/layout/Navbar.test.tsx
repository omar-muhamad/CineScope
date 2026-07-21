import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Navbar from "@/components/layout/Navbar";
import { renderWithProviders, testUser } from "@/tests/test-utils";

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

describe("Navbar personal links", () => {
  it("keeps favorites and watch later out of the desktop nav — they live in the user card", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />, { user: testUser });
    const nav = within(screen.getByTestId("nav-links"));

    expect(nav.queryByRole("link", { name: /favorites/i })).toBeNull();
    expect(nav.queryByRole("link", { name: /watch later/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Account menu" }));

    expect(
      screen.getByRole("button", { name: /favorites/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /watch later/i }),
    ).toBeInTheDocument();
  });

  it("keeps them in the mobile menu, where the user card isn't reachable", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />, { user: testUser });

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const mobileNav = within(screen.getByTestId("mobile-nav-links"));

    expect(mobileNav.getByRole("link", { name: /favorites/i })).toHaveAttribute(
      "href",
      "/favorites",
    );
    expect(
      mobileNav.getByRole("link", { name: /watch later/i }),
    ).toHaveAttribute("href", "/watch-later");
  });
});

describe("Navbar while the session is resolving", () => {
  it("holds skeleton slots instead of flashing the logged-out navbar", () => {
    renderWithProviders(<Navbar />, {
      user: testUser,
      session: { pending: true },
    });

    // The desktop nav carries no auth-gated links anymore — no placeholders.
    expect(
      within(screen.getByTestId("nav-links")).queryAllByTestId("skeleton"),
    ).toHaveLength(0);

    // The avatar button and the mobile Login/Logout button wait too.
    expect(screen.queryByRole("button", { name: "Account menu" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /^(login|logout)$/i }),
    ).toBeNull();

    // The mobile menu keeps the gated links (favorites, watch later,
    // history), so it holds their slots.
    expect(
      within(screen.getByTestId("mobile-nav-links")).getAllByTestId("skeleton"),
    ).toHaveLength(3);
  });

  it("swaps the skeletons for the gated mobile links and the avatar once signed in", () => {
    renderWithProviders(<Navbar />, { user: testUser });

    expect(screen.queryAllByTestId("skeleton")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Account menu" }),
    ).toBeInTheDocument();
    // Role queries can't reach the closed (aria-hidden) mobile menu; the
    // dedicated test above opens it and asserts the links.
    expect(
      within(screen.getByTestId("mobile-nav-links")).queryAllByTestId(
        "skeleton",
      ),
    ).toHaveLength(0);
  });

  it("drops the gated slots entirely once resolved signed out", () => {
    renderWithProviders(<Navbar />);

    expect(screen.queryAllByTestId("skeleton")).toHaveLength(0);
    expect(
      within(screen.getByTestId("mobile-nav-links")).queryByRole("link", {
        name: /favorites/i,
        hidden: true,
      }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Account menu" }),
    ).toBeInTheDocument();
  });
});
