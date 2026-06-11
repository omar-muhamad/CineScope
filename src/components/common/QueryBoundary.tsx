import { FC, ReactNode, Suspense } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { BsExclamationCircle } from "react-icons/bs";

import ErrorBoundary from "./ErrorBoundary";
import Text from "@/components/ui/Text";

type QueryBoundaryProps = {
  children: ReactNode;
  /** Skeleton shown while the suspending child loads. */
  fallback: ReactNode;
  /** When any value changes, a failed section auto-recovers (e.g. the route). */
  resetKeys?: unknown[];
};

/** Default section-level error UI with a retry that refetches failed queries. */
const SectionError: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
    <BsExclamationCircle className="text-4xl text-orange" />
    <Text className="text-gray">
      Something went wrong loading this section.
    </Text>
    <button
      type="button"
      onClick={onRetry}
      className="px-4 py-1.5 rounded-full bg-orange text-black text-sm hover:opacity-90"
    >
      Try again
    </button>
  </div>
);

/**
 * Wraps a suspending, data-fetching child: a Suspense boundary (showing
 * `fallback` while the query resolves) inside an ErrorBoundary whose retry
 * resets the failed query through TanStack's QueryErrorResetBoundary, so a
 * failed section recovers in place instead of taking down the whole app.
 */
const QueryBoundary: FC<QueryBoundaryProps> = ({
  children,
  fallback,
  resetKeys,
}) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        onReset={reset}
        resetKeys={resetKeys}
        fallback={(retry) => <SectionError onRetry={retry} />}
      >
        <Suspense fallback={fallback}>{children}</Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);

export default QueryBoundary;
