import type { Post } from "@/modules/posts/domain/post"

export interface PostsOutput {
  getPosts(): Promise<Post[]>
  getPostById(postId: number): Promise<Post>
  addPost(data: Post): Promise<Post>
  updatePost(postId: number, data: Post): Promise<Post>
  removePost(postId: number): Promise<void>
}