import { forwardRef, useImperativeHandle, useState } from "react";

import { outputs } from "@/config/outputs";
import {
  addPost,
  getPostById,
  updatePost,
} from "@/modules/posts/domain/posts.actions";
import { Input, Label } from "./ui";

type ILocalData = {
  isPending: boolean;
  values: {
    id: number | null;
    title: {
      value: string;
      error: string;
    };
    desc: {
      value: string;
      error: string;
    };
  };
};
const localData: ILocalData = {
  isPending: false,
  values: {
    id: null as number | null,
    title: { value: "", error: "" },
    desc: { value: "", error: "" },
  },
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type PostFormProps = {
  submitSuccess?: () => Promise<void>;
};

export type PostFormRef = {
  editPostById: (postId: number) => void;
};

const PostForm = forwardRef<PostFormRef, PostFormProps>((props, ref) => {
  const [data, setData] = useState<ILocalData>({ ...localData });

  // utils
  function getFormValues() {
    return {
      id: data.values.id as number,
      title: data.values.title.value,
      description: data.values.desc.value,
    };
  }
  function resetValues() {
    setData({ ...localData });
  }
  function isValid() {
    const _data = JSON.parse(JSON.stringify(data)) as ILocalData;

    if (!_data.values.title.value)
      _data.values.title.error = "Campo obrigatório";
    if (!_data.values.desc.value) _data.values.desc.error = "Campo obrigatório";

    setData(_data);

    return [_data.values.title.value, _data.values.desc.value].every(Boolean);
  }

  // record
  const EditPostById = async (postId: number) => {
    setData((prev) => ({ ...prev, isPending: true }));

    const post = await getPostById({
      postsOutput: outputs.postsOutput,
      postId,
    });
    const values = {
      id: post.id,
      title: { value: post.title, error: "" },
      desc: { value: post.description, error: "" },
    };
    setData((prev) => ({ ...prev, values, isPending: false }));
  };

  const onSubmit = async () => {
    if (!isValid()) return;

    setData((prev) => ({ ...prev, isPending: true }));

    void (data.values.id
      ? await updatePost({
          postsOutput: outputs.postsOutput,
          data: getFormValues(),
        })
      : await addPost({
          postsOutput: outputs.postsOutput,
          data: getFormValues(),
        }));

    await props.submitSuccess?.();

    resetValues();

    setData((prev) => ({ ...prev, isPending: false }));
  };

  useImperativeHandle(ref, () => ({
    editPostById: (postId: number) => EditPostById(postId),
  }));

  return (
    <>
      {/* <pre className="border-4 overflow-y-scroll h-[200px]">
        {JSON.stringify(data.values, null, 2)}
      </pre> */}

      <form
        id="post-form"
        className="grid gap-2"
        onSubmit={(event) => {
          console.log({ event });
          event.preventDefault();
          event.stopPropagation();

          onSubmit();
        }}
      >
        <Input.Root>
          <Label htmlFor="title">Title</Label>
          <Input.Content
            name="title"
            value={data.values.title.value}
            onChange={(value) => {
              const values = { ...data.values, title: { value, error: "" } };
              setData((prev) => ({ ...prev, values }));
            }}
            disabled={data.isPending}
          />
          <Input.Error message={data.values.title.error} />
        </Input.Root>

        <Input.Root>
          <Label htmlFor="description">Description</Label>
          <Input.Content
            name="description"
            value={data.values.desc.value}
            onChange={(value) => {
              const values = { ...data.values, desc: { value, error: "" } };
              setData((prev) => ({ ...prev, values }));
            }}
            disabled={data.isPending}
          />
          <Input.Error message={data.values.desc.error} />
        </Input.Root>
      </form>
    </>
  );
});

export default PostForm;
