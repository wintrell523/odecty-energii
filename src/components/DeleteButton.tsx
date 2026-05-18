"use client";

import { useTransition } from "react";

type Props = {
  action: () => Promise<void>;
  confirmText?: string;
  label?: string;
};

export default function DeleteButton({ action, confirmText = "Opravdu smazat?", label = "Smazat" }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-danger"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmText)) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {pending ? "Mažu…" : label}
    </button>
  );
}
