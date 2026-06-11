import { FC, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";

type NavSearchProps = {
  variant?: "nav" | "block";
  onSearch?: () => void;
};

const variantClasses = {
  nav: "w-32 sm:w-40 focus-within:w-56 sm:focus-within:w-72 transition-[width] duration-300 ease-in-out",
  block: "w-full",
};

const NavSearch: FC<NavSearchProps> = ({ variant = "nav", onSearch }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?search=${encodeURIComponent(trimmed)}`);
    onSearch?.();
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 rounded-full bg-main-dark p-3 focus-within:ring-1 focus-within:ring-orange ${variantClasses[variant]}`}
    >
      <button
        type="submit"
        aria-label="Submit search"
        className="shrink-0 text-gray hover:text-white"
      >
        <IoSearch className="size-5" />
      </button>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search..."
        aria-label="Search for movies and TV series"
        className="w-full min-w-0 bg-transparent text-sm outline-hidden caret-orange placeholder:text-gray"
      />
    </form>
  );
};
export default NavSearch;
