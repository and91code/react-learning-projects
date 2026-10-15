import type { FC } from "react";
import { Input as InputContentBase } from "../_shadcn/input";

const InputContent: FC<{
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (data: string) => void;
  disabled?: boolean;
}> = ({ onChange, ...props }) => {
  return (
    <InputContentBase
      {...props}
      onChange={({ target }) => onChange?.(target.value)}
    />
  );
};

export default InputContent;
