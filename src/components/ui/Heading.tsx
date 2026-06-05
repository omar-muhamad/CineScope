import { VariantProps, cva } from "class-variance-authority";
import { ComponentPropsWithoutRef, FC } from "react";

const headingClasses = cva(["antialiased"], {
  variants: {
    size: {
      lg: ["text-3xl"],
      md: ["text-2xl"],
      sm: ["text-lg"],
    },
    as: {
      h1: ["font-outfitLight"],
      h2: ["font-outfitLight"],
      h3: ["font-outfitMedium"],
      h4: ["font-outfitMedium"],
      h5: ["font-outfitMedium"],
      h6: ["font-outfitMedium"],
    },
  },
  defaultVariants: {
    size: "lg",
    as: "h1",
  },
});

export interface HeadingProps
  extends ComponentPropsWithoutRef<"h1" | "h2" | "h3" | "h4" | "h5" | "h6">,
    VariantProps<typeof headingClasses> {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Heading: FC<HeadingProps> = ({
  children,
  size,
  as,
  className,
  ...props
}) => {
  const Tag = as ;
  return (
    <Tag className={headingClasses({ size, as, className })} {...props}>
      {children}
    </Tag>
  );
};
export default Heading;
