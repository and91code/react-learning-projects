import type { FC, ReactNode } from "react";
import { AlertDialogTrigger } from "../_shadcn/alert-dialog";

const ModalTrigger: FC<{
  children: ReactNode;
  asChild?: boolean;
  onClick: () => void;
}> = ({ children, ...props }) => {
  return <AlertDialogTrigger {...props}>{children}</AlertDialogTrigger>;
};

export default ModalTrigger;
