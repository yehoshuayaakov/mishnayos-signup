import {
  FieldError,
  Input,
  Label,
  Text,
  TextField as RacTextField,
  type TextFieldProps as RacTextFieldProps,
} from "react-aria-components";

export function TextField({
  label,
  className = "",
  inputClassName = "",
  placeholder,
  description,
  errorMessage,
  ...props
}: RacTextFieldProps & {
  label: string;
  inputClassName?: string;
  placeholder?: string;
  description?: string;
  errorMessage?: string;
}) {
  return (
    <RacTextField {...props} className={`group flex flex-col gap-1.5 ${className}`}>
      <Label className="text-[0.82rem] font-bold text-[var(--navy-700)]">{label}</Label>
      <Input
        placeholder={placeholder}
        className={[
          "min-h-10 w-full appearance-none rounded-[10px] border-[1.5px] border-[var(--border)] bg-white px-3 py-2 font-[inherit] text-[0.95rem] text-[var(--text)] max-sm:min-h-11",
          "outline-none transition placeholder:text-[#9aa3ae] focus:border-[var(--navy-600)] focus:shadow-[0_0_0_3px_rgba(46,89,132,0.15)]",
          "data-[invalid]:border-[#b94a4a] data-[invalid]:focus:border-[#b94a4a] data-[invalid]:focus:shadow-[0_0_0_3px_rgba(185,74,74,0.12)] disabled:bg-[#f4f5f7] disabled:opacity-70",
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
    </RacTextField>
  );
}
