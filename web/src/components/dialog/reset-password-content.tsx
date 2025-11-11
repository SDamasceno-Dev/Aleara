"use client";

import { useState } from "react";
import { TextInput } from "@/components/text-input";
import { useDialog } from "@/components/dialog";
import { Button } from "@/components/button";

export function ResetPasswordContent() {
  const dialog = useDialog();
  const [emailValid, setEmailValid] = useState(false);
  const [forceValidate, setForceValidate] = useState(false);

  return (
    <div className="space-y-3">
      <p>Informe seu e-mail e enviaremos um link para redefinição.</p>
      <TextInput validatable="email" placeholder="seu@email.com" onValidChange={setEmailValid} forceValidate={forceValidate} />
      <div className="flex justify-end">
        <Button
          type="button"
          intent="gold"
          size="sm"
          onClick={() => {
            if (!emailValid) {
              setForceValidate(true);
              return;
            }
            dialog.close();
          }}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}


