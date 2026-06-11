import { screen } from "@testing-library/react";

import CastList from "@/pages/Details/components/CastList";
import { renderWithProviders } from "@/tests/test-utils";
import type { CastMember } from "@/types";

const makeCast = (
  overrides: Partial<CastMember> & { id: number },
): CastMember => ({
  name: `Actor ${overrides.id}`,
  character: `Character ${overrides.id}`,
  profile_path: "/headshot.jpg",
  order: overrides.id,
  ...overrides,
});

describe("CastList", () => {
  it("renders each member's name and character", () => {
    const cast = [
      makeCast({ id: 1, name: "Jane Doe", character: "Hero" }),
      makeCast({ id: 2, name: "John Roe", character: "Villain" }),
    ];

    renderWithProviders(<CastList cast={cast} />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByText("John Roe")).toBeInTheDocument();
    expect(screen.getByText("Villain")).toBeInTheDocument();
  });

  it("orders by billing `order` and caps at the top 12", () => {
    const cast = Array.from({ length: 20 }, (_, i) =>
      makeCast({ id: i, name: `Actor ${i}`, order: i }),
    );

    renderWithProviders(<CastList cast={cast} />);

    // The first-billed member is shown; the 13th-billed (order 12) is dropped.
    expect(screen.getByText("Actor 0")).toBeInTheDocument();
    expect(screen.getByText("Actor 11")).toBeInTheDocument();
    expect(screen.queryByText("Actor 12")).not.toBeInTheDocument();
  });

  it("renders a fallback when a member has no profile photo", () => {
    const cast = [makeCast({ id: 1, name: "No Photo", profile_path: null })];

    renderWithProviders(<CastList cast={cast} />);

    expect(screen.getByText("No Photo")).toBeInTheDocument();
  });

  it("renders nothing when the cast is empty", () => {
    const { container } = renderWithProviders(<CastList cast={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
