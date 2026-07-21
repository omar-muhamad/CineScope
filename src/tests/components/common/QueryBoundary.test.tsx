import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSuspenseQuery } from "@tanstack/react-query";

import QueryBoundary from "@/components/common/QueryBoundary";
import { renderWithProviders } from "@/tests/test-utils";

/**
 * A suspending child whose query rejects the first time and succeeds after, so
 * we can drive the full error → retry → recover path of a QueryBoundary.
 */
let attempts = 0;
const FlakyChild = () => {
  const { data } = useSuspenseQuery({
    queryKey: ["query-boundary-test"],
    queryFn: () => {
      attempts += 1;
      return attempts === 1
        ? Promise.reject(new Error("boom"))
        : Promise.resolve("recovered content");
    },
  });
  return <div>{data}</div>;
};

describe("QueryBoundary", () => {
  it("catches a failed suspense query and recovers on retry", async () => {
    attempts = 0;
    renderWithProviders(
      <QueryBoundary fallback={<div>loading…</div>}>
        <FlakyChild />
      </QueryBoundary>,
    );

    // The thrown query is caught in place — section error UI, not a crash.
    const retry = await screen.findByRole("button", { name: /try again/i });
    expect(retry).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Retry resets the failed query and re-runs it; the second attempt resolves.
    await userEvent.click(retry);
    expect(await screen.findByText("recovered content")).toBeInTheDocument();
  });
});
