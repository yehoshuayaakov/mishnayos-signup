"use client";

import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as RacSelect,
  SelectValue,
  type SelectProps,
} from "react-aria-components";

export type SelectOption = {
  id: string;
  label: string;
};

export function Select({
  label,
  options,
  className = "",
  errorMessage,
  ...props
}: Omit<SelectProps<SelectOption>, "children"> & {
  label: string;
  options: SelectOption[];
  errorMessage?: string;
}) {
  return (
    <RacSelect {...props} className={`group flex flex-col gap-1.5 ${className}`}>
      <Label className="text-[0.82rem] font-bold text-[var(--navy-700)]">{label}</Label>
      <Button className="flex min-h-10 w-full items-center justify-between rounded-[10px] border-[1.5px] border-[var(--border)] bg-white px-3 py-2 text-start font-[inherit] text-[0.95rem] text-[var(--text)] outline-none transition max-sm:min-h-11 data-[focus-visible]:border-[var(--navy-600)] data-[focus-visible]:shadow-[0_0_0_3px_rgba(46,89,132,0.15)] data-[disabled]:bg-[#f4f5f7] data-[invalid]:border-[#b94a4a]">
        <SelectValue />
        <span aria-hidden className="text-[0.7rem] text-[var(--muted)]">
          ▼
        </span>
      </Button>
      <FieldError className="text-[0.75rem] font-medium text-[#9c3535]">
        {errorMessage}
      </FieldError>
      <Popover className="min-w-[var(--trigger-width)] overflow-auto rounded-[10px] border border-[var(--border)] bg-white p-1 shadow-[0_10px_30px_rgba(15,31,51,0.16)]">
        <ListBox items={options} className="outline-none">
          {(option) => (
            <ListBoxItem
              id={option.id}
              textValue={option.label}
              className="cursor-pointer rounded-lg px-3 py-2 text-[0.9rem] outline-none data-[focused]:bg-[#eef2f6] data-[selected]:font-bold data-[selected]:text-[var(--navy-700)]"
            >
              {option.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </RacSelect>
  );
}
