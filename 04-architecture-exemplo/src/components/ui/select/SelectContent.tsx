import type { FC, ReactNode } from "react";
import { SelectContent as SelectContentBase } from "../_shadcn/select";

const SelectContent: FC<{ children: ReactNode }> = ({ children }) => {
  return <SelectContentBase>{children}</SelectContentBase>;
};

export default SelectContent;
