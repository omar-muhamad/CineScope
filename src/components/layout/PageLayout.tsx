import { FC, ReactNode } from "react";

import Loading from "../common/Loading";

type PageLayoutProps = {
  children: ReactNode;
  loading: boolean;
  /** Content-shaped placeholder shown while loading. Falls back to the spinner. */
  skeleton?: ReactNode;
};

const PageLayout: FC<PageLayoutProps> = ({ children, loading, skeleton }) => {
  return (
    <main className="w-full min-h-screen py-4 md:py-6 px-4 md:px-16">
      {loading ? (skeleton ?? <Loading />) : children}
    </main>
  );
};
export default PageLayout;
