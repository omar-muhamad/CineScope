import { findScrollParent, scrollTopForRow } from "../lib/railScroll";

// A 400px-tall rail showing 80px rows.
const base = { viewport: 400, rowHeight: 80 };

describe("scrollTopForRow", () => {
  it("leaves the rail alone when the row is already fully visible", () => {
    expect(scrollTopForRow({ ...base, scrollTop: 0, rowTop: 0 })).toBeNull();
    expect(scrollTopForRow({ ...base, scrollTop: 0, rowTop: 320 })).toBeNull();
    expect(
      scrollTopForRow({ ...base, scrollTop: 200, rowTop: 480 }),
    ).toBeNull();
  });

  it("centres a row below the fold", () => {
    // Row at 1000 with 320px of slack on either side once centred.
    expect(scrollTopForRow({ ...base, scrollTop: 0, rowTop: 1000 })).toBe(840);
  });

  it("centres a row above the fold", () => {
    expect(scrollTopForRow({ ...base, scrollTop: 900, rowTop: 400 })).toBe(240);
  });

  it("clamps to the top instead of returning a negative offset", () => {
    expect(scrollTopForRow({ ...base, scrollTop: 500, rowTop: 0 })).toBe(0);
    expect(scrollTopForRow({ ...base, scrollTop: 500, rowTop: 80 })).toBe(0);
  });

  it("no-ops when the element has not been measured yet", () => {
    expect(
      scrollTopForRow({ viewport: 0, rowHeight: 0, scrollTop: 0, rowTop: 0 }),
    ).toBeNull();
  });

  // Not reachable with today's fixed-height rows, but the maths stays sane:
  // a row taller than the rail overflows evenly at both ends.
  it("centres a row taller than the rail", () => {
    expect(
      scrollTopForRow({
        viewport: 100,
        rowHeight: 160,
        scrollTop: 0,
        rowTop: 500,
      }),
    ).toBe(530);
  });
});

/** jsdom reports every box as 0x0, so scroll metrics have to be faked. */
const withMetrics = (
  el: HTMLElement,
  {
    scrollHeight,
    clientHeight,
  }: { scrollHeight: number; clientHeight: number },
) => {
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight });
  Object.defineProperty(el, "clientHeight", { value: clientHeight });
  return el;
};

describe("findScrollParent", () => {
  const build = (
    overflowY: string,
    overflow = { scrollHeight: 900, clientHeight: 400 },
  ) => {
    const outer = document.createElement("div");
    const scroller = document.createElement("div");
    scroller.style.overflowY = overflowY;
    const list = document.createElement("ul");
    const row = document.createElement("li");
    list.append(row);
    scroller.append(list);
    outer.append(scroller);
    document.body.append(outer);
    withMetrics(scroller, overflow);
    return { scroller, row };
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("finds the nearest overflowing ancestor", () => {
    const { scroller, row } = build("auto");
    expect(findScrollParent(row)).toBe(scroller);
  });

  it("accepts overflow-y: scroll as well as auto", () => {
    const { scroller, row } = build("scroll");
    expect(findScrollParent(row)).toBe(scroller);
  });

  it("ignores an ancestor that scrolls but has no overflowing content", () => {
    const { row } = build("auto", { scrollHeight: 400, clientHeight: 400 });
    expect(findScrollParent(row)).toBeNull();
  });

  it("ignores a clipping ancestor that cannot scroll", () => {
    const { row } = build("hidden");
    expect(findScrollParent(row)).toBeNull();
  });

  it("returns null for a detached or missing element", () => {
    expect(findScrollParent(null)).toBeNull();
    expect(findScrollParent(document.createElement("li"))).toBeNull();
  });
});
