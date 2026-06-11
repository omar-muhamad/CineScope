import { FC } from "react";

import type { CastMember } from "@/types";
import CastCard from "./CastCard";

type CastListProps = {
  cast: CastMember[];
};

/** How many billed members to surface. */
const TOP_BILLED = 12;

/**
 * Horizontally scrolling "Top Billed Cast" row. Renders the most prominent
 * members (by TMDB billing `order`); returns null when there's no cast so the
 * section can be hidden entirely.
 */
const CastList: FC<CastListProps> = ({ cast }) => {
  const topCast = [...cast]
    .sort((a, b) => a.order - b.order)
    .slice(0, TOP_BILLED);

  if (topCast.length === 0) return null;

  return (
    <ul className="mt-6 flex gap-4 overflow-x-auto pb-4">
      {topCast.map((member) => (
        <CastCard
          key={member.id}
          name={member.name}
          character={member.character}
          profilePath={member.profile_path}
        />
      ))}
    </ul>
  );
};
export default CastList;
