import { VariantProps, cva } from "class-variance-authority";
import { ComponentPropsWithoutRef, FC } from "react";

const textClasses = cva(["antialiased"], {
  variants: {
    size: {
      base: ["text-base"],
      sm: ["text-sm"],
    },
  },
  defaultVariants: {
    size: "base",
  },
});

export interface TextProps
  extends ComponentPropsWithoutRef<"p">,
    VariantProps<typeof textClasses> {}

const Text: FC<TextProps> = ({ children, size, className, ...props }) => {
  return (
    <p className={textClasses({ size, className })} {...props}>
      {children}
    </p>
  );
};
export default Text;
