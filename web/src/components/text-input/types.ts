export type ValidationKind = 'none' | 'email';

export type TextInputProps = {
  id?: string;
  placeholder?: string;
  type?: string;
  initialValue?: string;
  validatable?: ValidationKind;
  onValidChange?(valid: boolean): void;
  forceValidate?: boolean;
  className?: string;
};
