import type { FC, ReactNode } from "react";
import { AlertDialogFooter } from "../_shadcn/alert-dialog";

const ModalFooter: FC<{ children: ReactNode }> = ({ children }) => {
  return <AlertDialogFooter>{children}</AlertDialogFooter>;
};

export default ModalFooter;
