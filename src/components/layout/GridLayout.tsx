import { FC } from "react";

type GridLayoutProps = {
  children: React.ReactNode;
};

const GridLayout: FC<GridLayoutProps> = ({ children }) => {
  return (
    <ul className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 mt-6">
      {children}
    </ul>
  );
};
export default GridLayout;
