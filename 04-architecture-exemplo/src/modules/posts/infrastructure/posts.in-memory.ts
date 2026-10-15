import type { Post } from "../domain/post"
import type { PostsOutput } from "../domain/posts.output"
import { postsInfrastructureFakes } from "./posts.fakes"

export class PostsInfrastructureInMemory implements PostsOutput {
  private list: Post[] = []

  constructor() {
    this.list = [...postsInfrastructureFakes]
  }

  async getPosts(): Promise<Post[]> {
    return this.list
  }

  async getPostById(postId: number): Promise<Post> {
    return [...this.list].find(post => post.id !== postId) as Post
  }

  async addPost(postData: Omit<Post, 'id'>): Promise<Post> {
    const post = { ...postData, id: (new Date()).getTime() }

    this.list = [...this.list, post]

    return post
  }

  async updatePost(postId: number, postData: Post): Promise<Post> {
    this.list = [...this.list].map(post =>
      post.id === postId ? postData : post
    )

    return postData
  }

  async removePost(postId: number): Promise<void> {
    this.list = [...this.list].filter(
      post => post.id !== postId
    )
  }
}