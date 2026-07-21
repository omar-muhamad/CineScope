import { FC } from "react";

import { Provider } from "../lib/providers";

type PlayerSelectorProps = {
  providers: Provider[];
  active: number;
  onSelect: (index: number) => void;
};

const PlayerSelector: FC<PlayerSelectorProps> = ({
  providers,
  active,
  onSelect,
}) => {
  return (
    <div className="flex">
      {providers.map((provider, index) => (
        <button
          key={provider.name}
          onClick={() => onSelect(index)}
          aria-pressed={index === active}
          className={`px-5 py-3 text-sm transition-colors duration-200 border-b-2 ${
            index === active
              ? "border-orange text-white bg-white/5"
              : "border-transparent text-gray hover:text-white hover:bg-white/5"
          } ${index === 0 ? "rounded-tl-lg" : ""}`}
        >
          {provider.name}
        </button>
      ))}
    </div>
  );
};

export default PlayerSelector;
