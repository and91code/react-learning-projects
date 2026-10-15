import type { Post } from "../domain/post";
import type { PostsOutput } from "../domain/posts.output";

export class PostsInfrastructureApi implements PostsOutput {
  async getPosts(): Promise<Post[]> {
    return await fetch('/posts', { method: 'GET' })
      .then(r => r.json() as Promise<Post[]>)
      .then((data: Post[]) => data)
  }

  async getPostById(postId: number): Promise<Post> {
    return await fetch('/posts/' + postId, { method: 'GET' })
      .then(r => r.json() as Promise<{ post: Post }>)
      .then(({ post }) => post)
  }

  async addPost(postData: Omit<Post, 'id'>): Promise<Post> {
    const post = { ...postData, id: (new Date()).getTime() }
    const body = JSON.stringify(post)

    await fetch('/posts', { method: 'POST', body })
      .then(r => r.json() as Promise<{ post: Post }>)
      .then(({ post }) => post)

    return post
  }

  async updatePost(postId: number, postData: Post): Promise<Post> {
    const post = { ...postData }
    const body = JSON.stringify(post)

    await fetch('/posts/' + postId, { method: 'PUT', body })
      .then(r => r.json() as Promise<{ post: Post }>)
      .then(({ post }) => post)

    return post
  }

  async removePost(postId: number): Promise<void> {
    await fetch('/posts/' + postId, { method: 'DELETE' })
  }
}