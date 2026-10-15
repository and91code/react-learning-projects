export type IPost = {
  id: number;
  title: string;
  description: string;
}
export type ILogin = {
  email: string;
  password: string;
}

export type GetPosts = () => Promise<void>
export type CreatePost = (data: IPost) => Promise<void>
export type UpadatePost = (id: number, data: IPost) => Promise<void>
export type DeletePost = (id: number) => Promise<void>