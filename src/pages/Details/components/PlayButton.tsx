import { IoPlayCircleOutline } from "react-icons/io5";

import Button from "@/components/ui/Button";

const PlayButton = ({
  className,
  onClick,
  children,
}: {
  className?: string;
  onClick: () => void;
  children?: React.ReactNode;
}) => {
  const resolvedClassName = className
    ? `flex items-center justify-center pr-3 ${className}`
    : "flex items-center justify-center pr-3";

  return (
    <Button rounded="full" className={resolvedClassName} onClick={onClick}>
      <IoPlayCircleOutline className="text-3xl mr-1" />
      {children ?? "Trailer"}
    </Button>
  );
};
export default PlayButton;
