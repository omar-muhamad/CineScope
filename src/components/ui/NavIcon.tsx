import { FC } from "react";
import { IconType } from "react-icons";
import { NavLink } from "react-router-dom";

type NavIconProps = {
  link: {
    id: number;
    path: string;
    title: string;
    icon: IconType;
  };
};

const NavIcon: FC<NavIconProps> = ({ link }) => {
  const { path, icon, title } = link;
  const Icon = icon;
  return (
    <NavLink to={path} className="text-2xl text-gray hover:text-white aria-[current=page]:text-white" area-label={`Link to ${title} page click to show more`}>
      <Icon />
    </NavLink>
  );
};
export default NavIcon;
