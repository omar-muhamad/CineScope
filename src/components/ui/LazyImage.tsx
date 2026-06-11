import { FC } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import defaultPoster from "@/assets/images/default-poster.png";

type LazyImageProps = {
  className?: string;
  src: string;
  alt: string;
  /** Shown (blurred) until the real image finishes loading. */
  placeholderSrc?: string;
};

const LazyImage: FC<LazyImageProps> = ({
  className,
  src,
  alt,
  placeholderSrc = defaultPoster,
}) => {
  return (
    <LazyLoadImage
      className={className}
      effect="blur"
      src={src}
      alt={alt}
      placeholderSrc={placeholderSrc}
      delayTime={100}
      wrapperClassName={className}
    />
  );
};
export default LazyImage;
