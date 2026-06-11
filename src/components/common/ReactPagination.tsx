import ReactPaginateDefault from "react-paginate";
import {
  IoIosArrowDropleftCircle,
  IoIosArrowDroprightCircle,
} from "react-icons/io";

// react-paginate is consumed as CommonJS, and Vite's dependency pre-bundler can
// surface its default export as a namespace object (`{ default: Component }`)
// instead of the component itself, which makes JSX throw "Element type is
// invalid ... got: object". Unwrap `.default` when present so this works under
// both interop behaviors (dev server vs. test/build).
const ReactPaginate = ((
  ReactPaginateDefault as unknown as { default?: typeof ReactPaginateDefault }
).default ?? ReactPaginateDefault) as typeof ReactPaginateDefault;

type ReactPaginationProps = {
  pageCount: number;
  handlePageClick: (event: { selected: number }) => void;
  page: number;
};

export default function ReactPagination({
  pageCount,
  handlePageClick,
  page,
}: ReactPaginationProps) {
  // The pagination control sits at the bottom of the grid, so after changing
  // page the user is left scrolled past the freshly loaded results. Scroll
  // back to the top so the new page starts from the first item.
  const onPageChange = (event: { selected: number }) => {
    handlePageClick(event);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ReactPaginate
      nextAriaLabel="next"
      previousAriaLabel="previous"
      pageCount={pageCount}
      onPageChange={onPageChange}
      marginPagesDisplayed={1}
      forcePage={page - 1}
      previousLabel={<IoIosArrowDropleftCircle className="w-full h-full" />}
      nextLabel={<IoIosArrowDroprightCircle className="w-full h-full" />}
      breakLabel={"-"}
      className="pagination mt-8 bg-secondary-dark w-full md:w-fit mx-auto p-2 md:p-4 rounded-lg flex items-center justify-center gap-2 md:gap-4 text-lg text-white font-outfitMedium"
      pageClassName="relative w-8 h-8"
      pageLinkClassName="absolute inset-0 flex items-center justify-center hover:bg-white hover:text-orange rounded-md"
      activeLinkClassName="absolute inset-0 flex items-center justify-center bg-orange rounded-md"
      previousClassName="w-9 h-9 text-orange hover:text-white  rounded-full"
      nextClassName="w-9 h-9 text-orange hover:text-white  rounded-full"
      breakClassName="relative h-8 w-4"
      breakLinkClassName="absolute inset-0 flex items-center justify-center hover:bg-white hover:text-orange rounded-md"
    />
  );
}
