import type { FC, ReactNode } from "react";
import { Select as SelectBase } from "../_shadcn/select";

const SelectRoot: FC<{
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}> = ({ children, onChange, ...props }) => {
  return (
    <SelectBase {...props} onValueChange={onChange}>
      {children}
    </SelectBase>
  );
};

export default SelectRoot;
