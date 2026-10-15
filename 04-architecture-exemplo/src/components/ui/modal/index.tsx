import ModalContent from "./ModalContent";
import ModalFooter from "./ModalFooter";
import ModalHeader from "./ModalHeader";
import ModalRoot, { type ModalRef } from "./ModalRoot";
import ModalTrigger from "./ModalTrigger";

const Modal = {
  Root: ModalRoot,
  Header: ModalHeader,
  Trigger: ModalTrigger,
  Content: ModalContent,
  Footer: ModalFooter,
};

// const Modal2 = () => {
//   const modalRef = useRef<ModalRef>(null);

//   return (
//     <div>
//       <span className="text-red-400">Modal2</span>

//       <Modal.Root ref={modalRef}>
//         <Modal.Trigger onClick={() => modalRef.current?.open()}>
//           Open
//         </Modal.Trigger>
//         <Modal.Content>
//           <Modal.Header tilte="Modal Title" />
//           Content
//           <Modal.Footer>
//             <button type="button" onClick={() => modalRef.current?.close()}>
//               Cancel
//             </button>
//             <button type="button">Continue</button>
//           </Modal.Footer>
//         </Modal.Content>
//       </Modal.Root>
//     </div>
//   );
// };

export { Modal };
export type { ModalRef };
