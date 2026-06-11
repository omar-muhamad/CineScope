import { FC, ReactNode } from "react";

import Loading from "../common/Loading";

type PageLayoutProps = {
  children: ReactNode;
  /**
   * Legacy prop-driven loading (still used by the bookmarks pages). Suspense
   * pages omit it and let a Suspense boundary drive the skeleton swap instead.
   */
  loading?: boolean;
  /** Content-shaped placeholder shown while loading. Falls back to the spinner. */
  skeleton?: ReactNode;
};

const PageLayout: FC<PageLayoutProps> = ({
  children,
  loading = false,
  skeleton,
}) => {
  return (
    <main className="w-full min-h-screen py-4 md:py-6 px-4 md:px-16">
      {loading ? (skeleton ?? <Loading />) : children}
    </main>
  );
};
export default PageLayout;
