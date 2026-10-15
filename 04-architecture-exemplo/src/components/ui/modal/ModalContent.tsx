import type { FC, ReactNode } from "react";
import { AlertDialogContent } from "../_shadcn/alert-dialog";

const ModalContent: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AlertDialogContent className="shadow-2xl dark:shadow-white/25">
      {children}
    </AlertDialogContent>
  );
};

export default ModalContent;
