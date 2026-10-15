import { useEffect, useRef } from "react";
import Header from "./components/layout/Header";
import Main from "./components/layout/Main";
import TimesInput from "./components/TimesInput";
import TimesTable from "./components/TimesTable";
import usePrepareStore from "./store/usePrepareStore";

function App() {
  const isMounted = useRef(false);

  const { isLoading, exec } = usePrepareStore();

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    exec();
  }, []);

  return (
    <>
      <Header disabled={isLoading} />
      {/* 
      <pre className="h-[200px] overflow-y-scroll border-4 p-4 mb-4">
        {JSON.stringify(store.state, null, 2)}
      </pre> 
      */}

      <Main>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          // <p>Oii</p>
          <>
            <TimesInput />
            <TimesTable />
          </>
        )}
      </Main>
    </>
  );
}

export default App;
