import { FC, ReactNode } from "react";

import Loading from "../common/Loading";

type PageLayoutProps = {
  children: ReactNode;
  loading: boolean;
};

const PageLayout: FC<PageLayoutProps> = ({ children, loading }) => {
  return (
    <main className="w-full min-h-screen py-6 px-5">
      {loading ? <Loading /> : children}
    </main>
  );
};
export default PageLayout;
