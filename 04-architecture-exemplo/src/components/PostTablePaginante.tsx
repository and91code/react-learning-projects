import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/utils";

const PostTableMore = () => {
  const isDisabled = false;

  function previewPage() {
    /** */
  }
  function nextPage() {
    /** */
  }
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={cn(isDisabled ? "" : "", "border-[1px]")}
        onClick={() => isDisabled && previewPage()}
      >
        <ChevronLeftIcon size={18} />
      </button>
      <button
        type="button"
        className={cn(isDisabled ? "" : "", "border-[1px]")}
        onClick={() => isDisabled && nextPage()}
      >
        <ChevronRightIcon size={18} />
      </button>
    </div>
  );
};

export default PostTableMore;
