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
        ? `https://vidsrcme.ru/embed/tv/${id}/${season}-${episode}`
        : `https://vidsrcme.ru/embed/movie/${id}`,
  },
  {
    name: "Player 2",
    build: ({ media_type, id, season, episode }) =>
      media_type === "tv"
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}`
        : `https://player.videasy.net/movie/${id}`,
  },
];
