import { FC, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";

const NavSearch: FC = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?search=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-full bg-main-dark px-3 py-2 w-32 sm:w-48 md:w-64 focus-within:ring-1 focus-within:ring-orange"
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
        className="w-full min-w-0 bg-transparent text-sm outline-none caret-orange placeholder:text-gray"
      />
    </form>
  );
};
export default NavSearch;
