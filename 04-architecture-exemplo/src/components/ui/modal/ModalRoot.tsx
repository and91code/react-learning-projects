import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ReactNode,
} from "react";
import { AlertDialog } from "../_shadcn/alert-dialog";

export type ModalRef = {
  open: () => void;
  close: () => void;
};
type ModalProps = { children: ReactNode; open?: boolean };

const ModalRoot = forwardRef<ModalRef, ModalProps>(
  ({ children, open: openInitial = false }, ref) => {
    const [open, setOpen] = useState(openInitial);

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }));

    return (
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
        }}
      >
        {children}
      </AlertDialog>
    );
  }
);

export default ModalRoot;
