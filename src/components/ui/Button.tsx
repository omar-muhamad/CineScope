import { cva, VariantProps } from "class-variance-authority";
import { ComponentPropsWithoutRef, FC } from "react";

const buttonClasses = cva([
  "bg-orange", "hover:bg-white","px-2","hover:text-black"
], {
  variants: {
    rounded: {
      full: "rounded-full",
      md: "rounded-md",
    },
    size: {
      small: ["text-sm"],
      medium: ["text-base"],
      large: ["text-lg"],
    },
  },
  defaultVariants: {
    rounded: "md",
    size: "medium",
  },
});

export interface ButtonProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonClasses> {}

const Button: FC<ButtonProps> = ({
  children,
  rounded,
  size,
  className,
  ...props
}) => {
  return (
    <button className={buttonClasses({ rounded, size, className })} {...props}>
      {children}
    </button>
  );
};

export default Button;
