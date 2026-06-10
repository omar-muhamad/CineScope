import { FC } from "react";

import { useAuth } from "@/auth/useAuth";
import type { SavedMeta } from "@/api/saved";
import SaveToggle from "./SaveToggle";

type SaveActionsProps = {
  id: number;
  media_type: string;
  /** Card metadata stored on add so saved pages render without re-hitting TMDB. */
  meta?: SavedMeta;
};

// Corner save toggle: always visible on mobile, revealed on hover/focus on
// desktop. The reveal is driven by a named `group/card` which the parent card
// must set (alongside `relative`, since these are absolutely positioned). The
// group is named so it doesn't collide with the unnamed `group` SaveToggle
// uses internally for its icon hover effect.

/**
 * Favorites + watch-later toggles for a card, split across the top corners.
 * Only rendered for signed-in users — logged-out visitors see no toggles on
 * cards. Expects the parent card to be `relative group/card`.
 */
const SaveActions: FC<SaveActionsProps> = ({ id, media_type, meta }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex gap-3">
      <SaveToggle id={id} media_type={media_type} kind="favorite" meta={meta} />

      <SaveToggle
        id={id}
        media_type={media_type}
        kind="watchlist"
        meta={meta}
      />
    </div>
  );
};

export default SaveActions;
