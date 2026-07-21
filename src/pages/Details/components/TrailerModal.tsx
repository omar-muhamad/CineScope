import { FC, useEffect } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";

import Heading from "@/components/ui/Heading";

type TrailerModalProps = {
  trailerUrl: string | null;
  onClose: () => void;
};

// Full-screen overlay shown when the user opens a trailer. Renders the YouTube
// embed when a URL is available, otherwise a "no trailer" message. Mounted only
// while open, so locking body scroll on mount / restoring it on unmount mirrors
// the previous `isModalOpened` effect.
const TrailerModal: FC<TrailerModalProps> = ({ trailerUrl, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const overlayClassName =
    "fixed z-50 inset-0 max-h-screen bg-black/80 backdrop-blur-[2px] flex justify-center overflow-y-hidden items-center";

  if (trailerUrl === null) {
    return (
      <div className={overlayClassName}>
        <button
          className="absolute text-5xl right-10 top-10 hover:text-red-500 z-30"
          onClick={onClose}
        >
          <IoCloseCircleOutline />
        </button>
        <Heading as="h1" className="text-center">
          Sorry, no trailer found
        </Heading>
      </div>
    );
  }

  return (
    <div className={overlayClassName}>
      <div className="relative w-[320px] h-50 md:w-160 md:h-90 lg:w-213.5 lg:h-120">
        <button
          className="absolute text-4xl -right-5 -top-8 md:-right-10 md:-top-10  hover:text-red-500 z-30"
          onClick={onClose}
        >
          <IoCloseCircleOutline />
        </button>
        <iframe
          className="w-full h-full"
          src={trailerUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default TrailerModal;
