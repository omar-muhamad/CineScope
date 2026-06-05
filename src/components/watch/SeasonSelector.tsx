import { FC, useEffect, useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";

import { Season } from "@/types";

type SeasonSelectorProps = {
  seasons: Season[];
  season: number;
  onSeasonChange: (season: number) => void;
};

const SeasonSelector: FC<SeasonSelectorProps> = ({
  seasons,
  season,
  onSeasonChange,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = seasons.find((s) => s.season_number === season);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (seasonNumber: number) => {
    onSeasonChange(seasonNumber);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full md:w-[350px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select season"
        className="flex w-full h-12 md:h-16 items-center justify-between bg-secondary-dark text-white font-outfitMedium text-lg rounded-lg pl-5 pr-5 py-3 outline-none cursor-pointer border border-white/10 hover:border-orange focus:border-orange transition-colors"
      >
        <span className="truncate">{selected?.name}</span>
        <IoChevronDown
          className={`ml-3 shrink-0 text-xl md:text-2xl text-white transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Seasons"
          className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-secondary-dark shadow-lg shadow-black/40"
        >
          {seasons.map((s) => {
            const isActive = s.season_number === season;
            return (
              <li key={s.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => handleSelect(s.season_number)}
                  className={`block w-full px-5 py-3 text-left font-outfitMedium text-lg transition-colors ${
                    isActive
                      ? "bg-white/5 text-orange"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {s.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SeasonSelector;
