import type { FC, ReactNode } from "react";

const InputRoot: FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

export default InputRoot;
