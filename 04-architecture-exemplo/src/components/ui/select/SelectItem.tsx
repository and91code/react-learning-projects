import type { FC, ReactNode } from "react";
import { SelectItem as SelectItemBase } from "../_shadcn/select";

const SelectItem: FC<{
  value: string;
  children: ReactNode;
}> = ({ value, children }) => {
  return <SelectItemBase value={value}>{children}</SelectItemBase>;
};

export default SelectItem;
