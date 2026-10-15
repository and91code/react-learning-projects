import { type FC } from "react";
import {
  SelectTrigger as SelectTriggerBase,
  SelectValue as SelectValueBase,
} from "../_shadcn/select";

const SelectValue: FC<{ placeholder?: string }> = (props) => {
  return (
    <SelectTriggerBase className="w-[180px]">
      <SelectValueBase {...props} />
    </SelectTriggerBase>
  );
};

export default SelectValue;
