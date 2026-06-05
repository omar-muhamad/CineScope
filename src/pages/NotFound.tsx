import Heading from "@/components/ui/Heading";

const NotFound = () => {
  return (
    <main className="w-full h-screen fixed inset-0 px-5 flex justify-center items-center">
      <div className="flex flex-col items-center justify-center">
        <Heading as="h1" className="-mt-0 text-orange text-center leading-10">
          404
          <br />
          Not Found
        </Heading>
      </div>
    </main>
  );
};
export default NotFound;
