import type { Post } from "@/modules/posts/domain/post"
import type { PostsOutput } from "@/modules/posts/domain/posts.output"

export const getPosts = async ({
  postsOutput,
}: {
  postsOutput: PostsOutput
}): Promise<Post[]> => {
  try {
    return await postsOutput.getPosts()
  } catch (error: unknown) {
    throw new Error(error)
  }
}

export const getPostById = async ({
  postsOutput,
  postId
}: {
  postsOutput: PostsOutput,
  postId: number
}): Promise<Post> => {
  try {
    return await postsOutput.getPostById(postId)
  } catch (error: unknown) {
    console.log(error);
    throw new Error(error)
  }
}

export const addPost = async ({
  postsOutput,
  data,
}: {
  postsOutput: PostsOutput
  data: Post
}): Promise<Post[]> => {
  try {
    return await postsOutput.addPost(data)
  } catch (error: unknown) {
    throw new Error(error)
  }
}

export const updatePost = async ({
  postsOutput,
  data,
}: {
  postsOutput: PostsOutput
  data: Post
}): Promise<Post[]> => {
  const { id: postId } = data

  try {
    return await postsOutput.updatePost(postId, data)
  } catch (error: unknown) {
    throw new Error(error)
  }
}

export const removePost = async ({
  postsOutput,
  postId,
}: {
  postsOutput: PostsOutput
  postId: number
}): Promise<Post[]> => {
  try {
    return await postsOutput.removePost(postId)
  } catch (error: unknown) {
    throw new Error(error)
  }
}