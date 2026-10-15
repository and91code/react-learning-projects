import useStore from "../store/useStore";

export default function TimesInput() {
  const store = useStore();
  return (
    <div className="app-card w-full md:max-w-48">
      TimesInput
      <pre className="h-[200px] overflow-y-scroll">
        {JSON.stringify(store.state, null, 2)}
      </pre>
    </div>
  );
}
