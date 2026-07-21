import { recordWatch } from "@/api/history";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe("recordWatch", () => {
  it("drops null TMDB meta fields instead of serializing them", async () => {
    // TMDB really returns null for missing posters/dates; the server rejects
    // null meta strings, so they must leave the payload entirely (axios only
    // drops undefined).
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await recordWatch({
      mediaType: "movie",
      mediaId: 7,
      meta: {
        title: "No Poster",
        poster_path: null,
        release_date: null,
        vote_average: null,
      },
    });

    const [path, body] = vi.mocked(api.post).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe("/history");
    expect(body).toMatchObject({
      mediaType: "movie",
      mediaId: 7,
      season: 0,
      episode: 0,
      title: "No Poster",
    });
    // What actually goes on the wire — no null survives serialization.
    expect(JSON.parse(JSON.stringify(body))).not.toHaveProperty("posterPath");
    expect(Object.values(body)).not.toContain(null);
  });
});
