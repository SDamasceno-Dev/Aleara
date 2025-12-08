'use client';

import { useMemo, useState, useEffect } from 'react';
import type { TextInputProps, ValidationKind } from './types';
import {
  inputErrorBorder,
  inputErrorText,
  inputField,
  inputRoot,
} from './styles';

function validate(value: string, kind: ValidationKind): string | null {
  if (kind === 'email') {
    const re = /^[\w.!#$%&’*+/=?`{|}~^-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return re.test(value) ? null : 'Formato de e-mail inválido';
  }
  return null;
}

export function TextInput({
  id,
  placeholder,
  type = 'text',
  initialValue = '',
  validatable = 'none',
  onValidChange,
  forceValidate,
  className,
}: TextInputProps) {
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (forceValidate) {
      const timer = window.setTimeout(() => {
        setTouched(true);
        if (onValidChange)
          onValidChange(validate(value.trim(), validatable) == null);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [forceValidate, onValidChange, validatable, value]);

  const error = useMemo(() => {
    if (!touched) return null;
    return validatable === 'none' ? null : validate(value.trim(), validatable);
  }, [touched, value, validatable]);

  // const valid = !error;

  return (
    <div className={className}>
      <div
        className={`${inputRoot} ${error ? inputErrorBorder : 'input-gold'}`.trim()}
      >
        <input
          id={id}
          placeholder={placeholder}
          type={type}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (onValidChange)
              onValidChange(validate(e.target.value, validatable) == null);
          }}
          onBlur={() => {
            setTouched(true);
            const err =
              validatable === 'none'
                ? null
                : validate(value.trim(), validatable);
            if (onValidChange) onValidChange(err == null);
          }}
          className={inputField}
        />
      </div>
      {error ? <div className={inputErrorText}>{error}</div> : null}
    </div>
  );
}
