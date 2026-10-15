import type { IPost } from "@/types";
import { cn } from "@/utils";
import { EditIcon, Trash2Icon } from "lucide-react";

const PostTableRow = ({
  post,
  onEdit,
  onDelete,
}: {
  post: IPost;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <div
      className={cn(
        "p-4 bg-gray-100 dark:bg-neutral-950",
        "border-[1px] border-neutral-400 dark:border-neutral-500 rounded"
      )}
    >
      <div className="flex gap-4 items-start">
        <span
          className={cn(
            "flex-1 truncate",
            "p-0 text-lg font-semibold dark:bg-transparent"
          )}
        >
          {post.title}
        </span>

        <div className="flex gap-1">
          <button
            type="button"
            className="py-1 hover:text-white bg-blue-500/30 hover:bg-blue-500"
            onClick={() => onEdit()}
          >
            <EditIcon size={18} />
          </button>

          <button
            type="button"
            className="py-1 hover:text-white bg-red-500/30 hover:bg-red-500"
            onClick={() => onDelete()}
          >
            <Trash2Icon size={18} />
          </button>
        </div>
      </div>
      <p
        className={cn(
          "flex-1",
          "text-sm text-neutral-400 dark:text-neutral-600 italic"
        )}
      >
        {post.description}
      </p>
    </div>
  );
};

export default PostTableRow;
