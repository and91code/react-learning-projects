import { Select } from "./ui";

const Actions = ({ onAddPost }: { onAddPost: () => void }) => {
  return (
    <>
      <section className="flex items-center justify-between mb-4">
        <button className="capitalize border-[1px]" onClick={() => onAddPost()}>
          add post
        </button>

        <Select.Root defaultValue="0" onChange={(value) => console.log(value)}>
          <Select.Value />
          <Select.Content>
            <Select.Item value="1">Ativo</Select.Item>
            <Select.Item value="0">Inativo</Select.Item>
          </Select.Content>
        </Select.Root>
      </section>
    </>
  );
};

export default Actions;
