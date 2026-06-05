import { FC } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import 'react-lazy-load-image-component/src/effects/blur.css';

type LazyImageProps = {
  className?: string;
  src: string;
  alt: string;
};

const LazyImage: FC<LazyImageProps> = ({ className, src, alt }) => {
  return (
    <LazyLoadImage className={className} effect="blur" src={src} alt={alt} delayTime={100} wrapperClassName={className}/>
  );
};
export default LazyImage;
