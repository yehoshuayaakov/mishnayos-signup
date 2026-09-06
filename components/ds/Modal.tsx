import type { CSSProperties, ReactNode } from "react";
import {
  Dialog,
  Heading,
  Modal as RacModal,
  ModalOverlay,
} from "react-aria-components";
import { Button } from "@/components/ds/Button";

export function Modal({
  isOpen,
  onOpenChange,
  title,
  subtitle,
  style,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: ReactNode;
  style?: CSSProperties;
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
}) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[rgb(15_31_51/0.58)] p-2 backdrop-blur-[2px] sm:items-center sm:p-5"
      style={style}
    >
      <RacModal className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[520px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-[0_18px_55px_rgba(15,31,51,0.3)] outline-none sm:max-h-[min(90dvh,740px)]">
        <Dialog className="relative flex min-h-0 flex-1 flex-col outline-none">
          {({ close }) => (
            <div className="flex min-h-0 flex-1 flex-col">
              <header className="relative shrink-0 border-b border-[var(--border)] px-5 py-5 sm:px-6">
                <span className="mb-2.5 block h-[3px] w-8 rounded-full bg-[var(--gold)]" />
                <Heading
                  slot="title"
                  className="max-w-[calc(100%-3rem)] text-[1.2rem] leading-tight font-bold text-[var(--navy-800)] sm:text-[1.3rem]"
                >
                  {title}
                </Heading>
                {subtitle && (
                  <div className="mt-1.5 text-[0.82rem] leading-5 text-[var(--muted)]">{subtitle}</div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="סגירת חלון"
                  className="absolute top-3 left-3 h-11 w-11 border-transparent p-0 sm:top-5 sm:left-5 sm:h-8 sm:min-h-8 sm:w-8"
                  onPress={close}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
                  </svg>
                </Button>
              </header>
              <div className="ds-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                {typeof children === "function" ? children({ close }) : children}
              </div>
            </div>
          )}
        </Dialog>
      </RacModal>
    </ModalOverlay>
  );
}
