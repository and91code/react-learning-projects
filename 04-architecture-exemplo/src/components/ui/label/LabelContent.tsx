import type { FC, LabelHTMLAttributes } from "react";

const Label: FC<LabelHTMLAttributes<HTMLLabelElement>> = (props) => {
  return <label {...props} />;
};

export default Label;
