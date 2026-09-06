"use client";

import {
  FieldError,
  Label,
  Text,
  TextArea as RacTextArea,
  TextField,
  type TextFieldProps,
} from "react-aria-components";

export function TextArea({
  label,
  className = "",
  inputClassName = "",
  description,
  errorMessage,
  ...props
}: TextFieldProps & {
  label: string;
  inputClassName?: string;
  description?: string;
  errorMessage?: string;
}) {
  return (
    <TextField {...props} className={`group flex flex-col gap-1.5 ${className}`}>
      <Label className="text-[0.82rem] font-bold text-[var(--navy-700)]">{label}</Label>
      <RacTextArea
        className={[
          "min-h-28 w-full resize-y appearance-none rounded-[10px] border-[1.5px] border-[var(--border)] bg-white px-3 py-2 font-[inherit] text-[0.95rem] leading-6 text-[var(--text)]",
          "outline-none transition placeholder:text-[#9aa3ae] focus:border-[var(--navy-600)] focus:shadow-[0_0_0_3px_rgba(46,89,132,0.15)]",
          "data-[invalid]:border-[#b94a4a] disabled:bg-[#f4f5f7] disabled:opacity-70",
          inputClassName,
        ].join(" ")}
      />
      {description && (
        <Text slot="description" className="text-[0.75rem] leading-5 text-[var(--muted)]">
          {description}
        </Text>
      )}
      <FieldError className="text-[0.75rem] font-medium text-[#9c3535]">
        {errorMessage}
      </FieldError>
    </TextField>
  );
}
