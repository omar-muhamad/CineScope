import { FC, useState } from "react";
import { act, fireEvent, screen } from "@testing-library/react";

import { useAutoRecordWatch } from "../hooks/useAutoRecordWatch";
import { renderWithProviders, testUser } from "@/tests/test-utils";

const { recordWatchMock, fetchHistoryMock } = vi.hoisted(() => ({
  recordWatchMock: vi.fn(),
  fetchHistoryMock: vi.fn(),
}));

vi.mock("@/api/history", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/history")>();
  return {
    ...actual,
    recordWatch: recordWatchMock,
    fetchHistory: fetchHistoryMock,
  };
});

const Recorder: FC<{ episode: number }> = ({ episode }) => {
  useAutoRecordWatch({
    mediaType: "tv",
    mediaId: 100,
    season: 1,
    episode,
    meta: { title: "Test Show" },
    enabled: true,
  });
  return null;
};

/** Episode switching + a same-props rerender, driven from inside the tree so
 *  the provider stack from renderWithProviders stays mounted. */
const Harness: FC = () => {
  const [episode, setEpisode] = useState(1);
  const [, setTick] = useState(0);
  return (
    <>
      <button onClick={() => setEpisode(2)}>next episode</button>
      <button onClick={() => setTick((t) => t + 1)}>rerender</button>
      <Recorder episode={episode} />
    </>
  );
};

beforeEach(() => {
  vi.useFakeTimers();
  recordWatchMock.mockReset().mockResolvedValue(undefined);
  fetchHistoryMock.mockReset().mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAutoRecordWatch", () => {
  it("records once after the delay, and not again on rerenders", async () => {
    renderWithProviders(<Harness />, { user: testUser });

    // Nothing before the debounce window closes.
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(recordWatchMock).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(recordWatchMock).toHaveBeenCalledTimes(1);
    // react-query passes (variables, context) — assert on the variables.
    expect(recordWatchMock.mock.calls[0][0]).toMatchObject({
      mediaType: "tv",
      mediaId: 100,
      season: 1,
      episode: 1,
    });

    // A rerender with the same key must not re-record.
    fireEvent.click(screen.getByText("rerender"));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(recordWatchMock).toHaveBeenCalledTimes(1);
  });

  it("only records the final episode when flipping within the delay", async () => {
    renderWithProviders(<Harness />, { user: testUser });

    await act(() => vi.advanceTimersByTimeAsync(1000));
    fireEvent.click(screen.getByText("next episode"));
    await act(() => vi.advanceTimersByTimeAsync(3000));

    expect(recordWatchMock).toHaveBeenCalledTimes(1);
    expect(recordWatchMock.mock.calls[0][0]).toMatchObject({ episode: 2 });
  });

  it("records nothing when signed out", async () => {
    renderWithProviders(<Harness />);

    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(recordWatchMock).not.toHaveBeenCalled();
  });
});
