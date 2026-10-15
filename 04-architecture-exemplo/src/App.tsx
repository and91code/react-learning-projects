import { SaveIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { startMirage } from "./api/config";
import Actions from "./components/Actions";
import Container from "./components/layout/container";
import Header from "./components/layout/header";
import PostForm, { type PostFormRef } from "./components/PostForm";
import PostTable from "./components/PostTable";
import { Modal, type ModalRef } from "./components/ui";
import { outputs } from "./config/outputs";
import type { Post } from "./modules/posts/domain/post";
import { getPosts, removePost } from "./modules/posts/domain/posts.actions";

startMirage();

function App() {
  const modalRef = useRef<ModalRef>(null);
  const postFormRef = useRef<PostFormRef>(null);

  const [posts, setPosts] = useState<Post[]>([]);

  const getData = async () => {
    setPosts(await getPosts({ postsOutput: outputs.postsOutput }));
  };

  useEffect(() => {
    getData();
  }, []);

  // useEffect(() => {
  //   const s = startMirage();
  //   return () => {
  //     s.shutdown();
  //   };
  // }, []);

  return (
    <>
      <Container>
        <Header />
        <Actions
          onAddPost={() => {
            modalRef.current?.open();
          }}
        />
        <PostTable
          posts={posts}
          onEditPost={(postId: number) => {
            modalRef.current?.open();
            setTimeout(() => {
              postFormRef.current?.editPostById(postId);
            });
          }}
          onDeletePost={async (postId: number) => {
            removePost({ postsOutput: outputs.postsOutput, postId });
            await getData();
          }}
        />
      </Container>

      <Modal.Root ref={modalRef}>
        <Modal.Content>
          <Modal.Header tilte="Post" />

          <PostForm
            ref={postFormRef}
            submitSuccess={async () => {
              modalRef.current?.close();
              await getData();
            }}
          />
          <Modal.Footer>
            <button type="button" onClick={() => modalRef.current?.close()}>
              <XIcon size={18} />
            </button>
            <button type="submit" form="post-form">
              <SaveIcon size={18} />
            </button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}

export default App;
