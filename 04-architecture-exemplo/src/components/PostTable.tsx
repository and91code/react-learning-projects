import type { Post } from "@/modules/posts/domain/post";
// import PostTablePaginante from "./PostTablePaginante";
import PostTableRow from "./PostTableRow";

const PostTable = ({
  posts,
  onEditPost,
  onDeletePost,
}: {
  posts: Post[];
  onEditPost: (postId: number) => void;
  onDeletePost: (postId: number) => void;
}) => {
  return (
    <>
      <div className="max-h-[50.60vh] overflow-y-scroll space-y-2 mb-4 p-2 bg-gray-300/90 dark:bg-neutral-900 rounded">
        {posts.map((post) => (
          <PostTableRow
            key={post.id}
            {...{
              post,
              onEdit: () => onEditPost(post.id),
              onDelete: () => onDeletePost(post.id),
            }}
          />
        ))}
      </div>

      {/* <PostTablePaginante /> */}
    </>
  );
};

export default PostTable;
