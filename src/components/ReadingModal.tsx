"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ReadingModal({ children, returnTo }: {
  children: React.ReactNode;
  returnTo?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const close = () => returnTo ? router.replace(returnTo) : router.back();

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
      aria-label="Nový odečet"
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
      {children}
    </dialog>
  );
}
