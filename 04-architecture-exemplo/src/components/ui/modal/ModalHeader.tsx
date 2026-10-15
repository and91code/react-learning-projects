import type { FC, ReactNode } from "react";
import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../_shadcn/alert-dialog";

const ModalHeader: FC<{
  children?: ReactNode;
  tilte?: string;
  description?: string;
}> = ({ children, tilte, description }) => {
  if (tilte)
    return (
      <AlertDialogHeader>
        <AlertDialogTitle>{tilte}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
    );

  return (
    <AlertDialogHeader>
      {children}
      <AlertDialogDescription />
    </AlertDialogHeader>
  );
};

export default ModalHeader;
