import { FC } from "react";

type TrendingWrapperProps = { children: React.ReactNode };

const TrendingWrapper: FC<TrendingWrapperProps> = ({ children }) => {
  return (
    <div className="w-full overflow-x-scroll no-scrollbar mt-6">
      <ul className="carousel flex w-max">{children}</ul>
    </div>
  );
};
export default TrendingWrapper;
