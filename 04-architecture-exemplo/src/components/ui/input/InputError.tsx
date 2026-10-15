import { cn } from "@/utils";
import type { FC } from "react";

const InputError: FC<{
  message?: string;
  className?: string;
}> = ({ message, className }) => {
  return !message ? null : (
    <span
      className={cn(
        "text-xs font-bold text-red-500 dark:text-red-400",
        className
      )}
    >
      {message}
    </span>
  );
};

export default InputError;
