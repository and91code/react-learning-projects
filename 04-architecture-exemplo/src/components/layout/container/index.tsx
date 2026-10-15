import type { ReactNode } from "react";

const Container = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-screen h-screen flex items-center justify-center p-2">
      <div className="w-full max-w-xl flex flex-col">{children}</div>
    </div>
  );
};

export default Container;
