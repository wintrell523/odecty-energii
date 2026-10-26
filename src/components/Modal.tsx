"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const CloseModal = createContext<(() => void) | null>(null);

/** Closes the surrounding modal; null when the caller is not inside one. */
export function useCloseModal() {
  return useContext(CloseModal);
}

export default function Modal({ children, label, returnTo }: {
  children: React.ReactNode;
  label: string;
  returnTo?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const close = useCallback(
    () => (returnTo ? router.replace(returnTo) : router.back()),
    [returnTo, router],
  );

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label={label}
      className="reading-modal"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <button
        type="button"
        className="btn btn-ghost absolute right-3 top-3"
        aria-label="Zavřít okno"
        onClick={close}
      >
        ✕
      </button>
      <CloseModal.Provider value={close}>{children}</CloseModal.Provider>
    </dialog>
  );
}
