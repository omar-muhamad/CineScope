import { fireEvent, render, screen } from "@testing-library/react";

import EpisodeRail from "../components/EpisodeRail";
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

describe("EpisodeRail", () => {
  it("renders a row per episode and marks the active one as playing", () => {
    render(
      <EpisodeRail episodes={episodes} activeEpisode={2} onSelect={vi.fn()} />,
    );

    expect(screen.getByText("Episode 1")).toBeInTheDocument();
    expect(screen.getByText("Episode 3")).toBeInTheDocument();

    // The Playing badge lives only in the active row.
    const playing = screen.getAllByText("Playing");
    expect(playing).toHaveLength(1);
    expect(screen.getByText("Episode 2").closest("li")?.textContent).toContain(
      "Playing",
    );
  });

  it("selects an episode when its row is clicked", () => {
    const onSelect = vi.fn();
    render(
      <EpisodeRail episodes={episodes} activeEpisode={1} onSelect={onSelect} />,
    );

    fireEvent.click(screen.getByText("Episode 3"));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("hides the per-episode toggle when onToggleWatched is absent (signed out)", () => {
    render(
      <EpisodeRail
        episodes={episodes}
        activeEpisode={1}
        onSelect={vi.fn()}
        watchedEpisodes={new Set([2])}
      />,
    );

    expect(
      screen.queryByLabelText(/Mark episode \d+ as watched/),
    ).not.toBeInTheDocument();
  });

  it("reflects and toggles watched state without selecting the row", () => {
    const onSelect = vi.fn();
    const onToggleWatched = vi.fn();

    render(
      <EpisodeRail
        episodes={episodes}
        activeEpisode={1}
        onSelect={onSelect}
        watchedEpisodes={new Set([2])}
        onToggleWatched={onToggleWatched}
      />,
    );

    // Watched episodes expose the "Remove" label; unwatched ones the "Mark" one.
    fireEvent.click(screen.getByLabelText("Mark episode 3 as watched"));
    expect(onToggleWatched).toHaveBeenCalledWith(3, true);

    fireEvent.click(
      screen.getByLabelText("Remove episode 2 from watch history"),
    );
    expect(onToggleWatched).toHaveBeenCalledWith(2, false);

    // The toggle is a sibling of the row button — never a selection click.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a Watched tag only on watched episodes", () => {
    render(
      <EpisodeRail
        episodes={episodes}
        activeEpisode={1}
        onSelect={vi.fn()}
        watchedEpisodes={new Set([2])}
      />,
    );

    expect(screen.getAllByText("Watched")).toHaveLength(1);
    expect(screen.getByText("Episode 2").closest("li")?.textContent).toContain(
      "Watched",
    );
  });

  it("renders skeleton rows while loading and an empty state otherwise", () => {
    const { rerender } = render(
      <EpisodeRail
        episodes={[]}
        activeEpisode={1}
        loading
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getAllByTestId("skeleton-rail-episode").length,
    ).toBeGreaterThan(0);

    rerender(
      <EpisodeRail episodes={[]} activeEpisode={1} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/No episodes available/i)).toBeInTheDocument();
  });
});
