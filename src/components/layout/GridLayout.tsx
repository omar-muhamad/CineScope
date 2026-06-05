import { FC } from "react";

type GridLayoutProps = {
  children: React.ReactNode;
};

const GridLayout: FC<GridLayoutProps> = ({ children }) => {
  return (
    <ul className="w-full grid grid-cols-1 sm:grid-cols-2  md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mt-6 pr-6">
      {children}
    </ul>
  );
};
export default GridLayout;
