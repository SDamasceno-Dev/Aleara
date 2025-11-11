"use client";

import { useState } from "react";
import { TextInput } from "@/components/text-input";
import { useDialog } from "@/components/dialog";

export function ResetPasswordContent() {
  const dialog = useDialog();
  const [emailValid, setEmailValid] = useState(false);

  return (
    <div className="space-y-3">
      <p>Informe seu e-mail e enviaremos um link para redefinição.</p>
      <TextInput validatable="email" placeholder="seu@email.com" onValidChange={setEmailValid} />
      <div className="flex justify-end">
        <button
          className="inline-flex h-9 items-center justify-center rounded-md bg-(--wine) px-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          onClick={() => {
            if (!emailValid) return;
            dialog.close();
          }}
          disabled={!emailValid}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}


