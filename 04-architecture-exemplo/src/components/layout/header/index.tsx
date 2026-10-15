import { cn } from "@/utils";
import { Sun } from "lucide-react";

const Header = () => {
  const toggleTheme = () => {
    window.document.body.classList.toggle("dark");
  };

  return (
    <header
      className={cn(
        "h-24 mb-8 relative",
        "flex items-center justify-center",
        "border-y-[1px] border-neutral-400 dark:border-neutral-700"
      )}
    >
      <h1 className={cn("text-5xl", "capitalize")}>Post's</h1>

      {/* <button className={cn("absolute top-2 left-0", "lowercase border-[1px]")}>
        Sign-in
      </button> */}

      <button
        className={cn(
          "absolute top-2 right-0",
          "flex items-center justify-center border-[1px]"
        )}
        onClick={toggleTheme}
      >
        <Sun size="18" />
      </button>
    </header>
  );
};

export default Header;
