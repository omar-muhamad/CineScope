import { FC, useState } from "react";

import SavedMediaPage from "@/components/common/SavedMediaPage";
import Text from "@/components/ui/Text";
import {
  useClearHistory,
  useHistoryItems,
  useRemoveFromHistory,
} from "@/queries/useWatchHistory";
import type { MediaType } from "@/lib/tmdb";
import type { MediaItem } from "@/types";

/** Inline two-step confirmation — destructive, but no modal infra needed. */
const ClearHistoryButton: FC<{ onClear: () => void }> = ({ onClear }) => {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="px-4 py-1.5 rounded-full text-sm bg-secondary-dark text-gray transition-colors hover:text-white"
      >
        Clear history
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Text size="sm" className="text-gray">
        Clear entire history?
      </Text>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          onClear();
        }}
        className="px-4 py-1.5 rounded-full text-sm bg-orange text-black transition-colors hover:bg-white"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="px-4 py-1.5 rounded-full text-sm bg-secondary-dark text-gray transition-colors hover:text-white"
      >
        Cancel
      </button>
    </div>
  );
};

/**
 * Watch history: one card per title (a TV show's episode rows are grouped by
 * useHistoryItems), newest watch first. Removing a show drops every episode
 * row, so its poster badge and episode indicators reset together.
 */
const History = () => {
  const { items, isLoading } = useHistoryItems();
  const removeFromHistory = useRemoveFromHistory();
  const clearHistory = useClearHistory();

  const handleRemove = (item: MediaItem) => {
    removeFromHistory.mutate({
      mediaType: item.media_type as MediaType,
      mediaId: item.id,
    });
  };

  return (
    <SavedMediaPage
      label="Watch History"
      items={items}
      loading={isLoading}
      showWatchedBadge={false}
      onRemoveItem={handleRemove}
      headerActions={
        items.length > 0 ? (
          <ClearHistoryButton onClear={() => clearHistory.mutate()} />
        ) : undefined
      }
    />
  );
};

export default History;
