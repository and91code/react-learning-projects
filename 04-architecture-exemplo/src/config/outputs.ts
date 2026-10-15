import { PostsInfrastructureApi } from "@/modules/posts/infrastructure/posts.api"

export const outputs = {
  postsOutput: new PostsInfrastructureApi(),
}