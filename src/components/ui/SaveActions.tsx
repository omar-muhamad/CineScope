import { FC } from "react";

import SaveToggle from "./SaveToggle";

type SaveActionsProps = {
  id: number;
  media_type: string;
  /** Size classes applied to each toggle. */
  size?: string;
  className?: string;
};

/** Favorites + watch-later toggles, shown side by side. */
const SaveActions: FC<SaveActionsProps> = ({
  id,
  media_type,
  size = "w-8 h-8",
  className,
}) => (
  <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
    <div className={size}>
      <SaveToggle
        id={id}
        media_type={media_type}
        kind="favorite"
        className="w-full h-full"
      />
    </div>
    <div className={size}>
      <SaveToggle
        id={id}
        media_type={media_type}
        kind="watchlist"
        className="w-full h-full"
      />
    </div>
  </div>
);

export default SaveActions;
