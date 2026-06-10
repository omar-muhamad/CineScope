import { FC } from "react";

import type { SavedMeta } from "@/api/saved";
import SaveToggle from "./SaveToggle";

type BookMarkProps = {
  id: number;
  media_type: string;
  meta?: SavedMeta;
  className?: string;
};

/** Bookmark toggle, backed by the signed-in user's favorites. */
const BookMark: FC<BookMarkProps> = ({ id, media_type, meta, className }) => (
  <SaveToggle
    id={id}
    media_type={media_type}
    kind="favorite"
    meta={meta}
    className={className}
  />
);

export default BookMark;
