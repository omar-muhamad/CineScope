import { fireEvent, render, screen } from "@testing-library/react";

import EpisodeList from "../components/EpisodeList";
import type { Episode } from "@/types";

const makeEpisode = (episode_number: number): Episode => ({
  id: episode_number,
  episode_number,
  season_number: 1,
  name: `Episode ${episode_number}`,
  overview: "",
  air_date: "2024-01-01",
  vote_average: 8,
  runtime: 45,
  still_path: null,
});

const episodes = [makeEpisode(1), makeEpisode(2), makeEpisode(3)];

describe("EpisodeList watched indicators", () => {
  it("shows the Watched pill only on watched episodes", () => {
    render(
      <EpisodeList
        episodes={episodes}
        activeEpisode={1}
        onSelect={vi.fn()}
        watchedEpisodes={new Set([2])}
      />,
    );

    expect(screen.getAllByText("Watched")).toHaveLength(1);
    // The pill lives in EP 2's row.
    expect(screen.getByText("Episode 2").closest("li")?.textContent).toContain(
      "Watched",
    );
  });

  it("hides the per-episode toggle when onToggleWatched is absent (signed out)", () => {
    render(
      <EpisodeList
        episodes={episodes}
        activeEpisode={1}
        onSelect={vi.fn()}
        watchedEpisodes={new Set()}
      />,
    );

    expect(
      screen.queryByLabelText(/Mark episode \d+ as watched/),
    ).not.toBeInTheDocument();
  });

  it("toggles an episode's watched state without selecting it", () => {
    const onSelect = vi.fn();
    const onToggleWatched = vi.fn();

    render(
      <EpisodeList
        episodes={episodes}
        activeEpisode={1}
        onSelect={onSelect}
        watchedEpisodes={new Set([2])}
        onToggleWatched={onToggleWatched}
      />,
    );

    // Unwatched episode → mark.
    fireEvent.click(screen.getByLabelText("Mark episode 3 as watched"));
    expect(onToggleWatched).toHaveBeenCalledWith(3, true);

    // Watched episode → unmark.
    fireEvent.click(
      screen.getByLabelText("Remove episode 2 from watch history"),
    );
    expect(onToggleWatched).toHaveBeenCalledWith(2, false);

    // The toggle is a sibling of the row button — never a selection click.
    expect(onSelect).not.toHaveBeenCalled();
  });
});
