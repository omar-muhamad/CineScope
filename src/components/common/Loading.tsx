const Loading = () => {
  return (
    <div data-testid="loading-component" className="h-[calc(100vh-12rem)] md:h-full w-full flex justify-center items-center md:pr-6">
      <div className="w-12 h-12 md:w-14 md:h-14 border-[5px] border-t-orange rounded-full border-[#ffffff90] animate-spin" />
    </div>
  );
};
export default Loading;
