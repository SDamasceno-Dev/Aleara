'use client';

import type {
  ButtonProps,
  ButtonIntent,
  ButtonVariant,
  ButtonSize,
} from './types';
import { baseButton, getVariantStyles, sizeStyles } from './styles';

export function Button({
  variant = 'solid',
  intent = 'primary',
  size = 'md',
  leftIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  const variantClasses = getVariantStyles(
    variant as ButtonVariant,
    intent as ButtonIntent,
  );
  const sizeClasses = sizeStyles[size as ButtonSize];
  return (
    <button
      className={`${baseButton} ${sizeClasses} ${variantClasses} ${className ?? ''}`.trim()}
      {...props}
    >
      {leftIcon ? (
        <span className='inline-flex items-center justify-center'>
          {leftIcon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

export * from './types';
