export type BuildArgs = {
  media_type?: string;
  id?: string;
  season: number;
  episode: number;
};

export type Provider = {
  name: string;
  build: (args: BuildArgs) => string;
};

export const providers: Provider[] = [
  {
    name: "Player 1",
    build: ({ media_type, id, season, episode }) =>
      media_type === "tv"
        ? `https://vsembed.su/embed/tv/${id}/${season}-${episode}`
        : `https://vsembed.su/embed/movie/${id}`,
  },
  {
    name: "Player 2",
    build: ({ media_type, id, season, episode }) =>
      media_type === "tv"
        ? `https://vidcore.net/tv/${id}/${season}/${episode}`
        : `https://vidcore.net/movie/${id}`,
  },
  {
    name: "Player 3",
    build: ({ media_type, id, season, episode }) =>
      media_type === "tv"
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}`
        : `https://player.videasy.net/movie/${id}`,
  },
  {
    name: "Player 4",
    build: ({ media_type, id, season, episode }) =>
      media_type === "tv"
        ? `https://player.cinezo.live/embed/tv/${id}/${season}/${episode}`
        : `https://player.cinezo.live/embed/movie/${id}`,
  },
];
