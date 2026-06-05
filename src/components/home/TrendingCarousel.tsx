import { FC, useEffect, useRef } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

type TrendingWrapperProps = { children: React.ReactNode };

const TrendingWrapper: FC<TrendingWrapperProps> = ({ children }) => {
  const scrollRef = useRef<HTMLUListElement>(null);
  const isPausedRef = useRef(false);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Auto-advance one card every 2s, looping back to the start at the end.
  // Pauses while the user is hovering so it doesn't fight manual browsing.
  useEffect(() => {
    const advance = () => {
      const el = scrollRef.current;
      if (!el || isPausedRef.current) return;
      const firstItem = el.firstElementChild as HTMLElement | null;
      const gap = 16; // matches the `gap-4` (1rem) between cards
      const step = firstItem
        ? firstItem.offsetWidth + gap
        : el.clientWidth * 0.8;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + step,
        behavior: "smooth",
      });
    };

    const id = window.setInterval(advance, 2000);
    return () => window.clearInterval(id);
  }, []);

  const arrowBase =
    "absolute top-1/2 -translate-y-1/2 z-40 hidden sm:flex items-center justify-center w-14 h-14 rounded-full text-white text-3xl bg-orange/80 border border-white/10 backdrop-blur-sm shadow-lg transition-all duration-300 hover:bg-white hover:text-orange hover:scale-105";

  return (
    <div
      className="relative w-full px-4 md:px-6 mt-6"
      onMouseEnter={() => (isPausedRef.current = true)}
      onMouseLeave={() => (isPausedRef.current = false)}
    >
      <ul
        ref={scrollRef}
        className="flex gap-4 overflow-x-scroll no-scrollbar scroll-smooth"
      >
        {children}
      </ul>

      <button
        type="button"
        aria-label="Previous"
        onClick={() => scroll("left")}
        className={`${arrowBase} left-2`}
      >
        <IoChevronBack />
      </button>

      <button
        type="button"
        aria-label="Next"
        onClick={() => scroll("right")}
        className={`${arrowBase} right-2`}
      >
        <IoChevronForward />
      </button>
    </div>
  );
};
export default TrendingWrapper;
