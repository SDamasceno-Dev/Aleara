import { iconBase } from './styles';
import type { IconProps } from './types';

export function GoogleIcon(props: IconProps) {
  const className = props.className
    ? `${iconBase} ${props.className}`
    : iconBase;
  return (
    <svg
      viewBox='0 0 24 24'
      width='1em'
      height='1em'
      aria-hidden='true'
      {...props}
      className={className}
    >
      <path
        fill='#EA4335'
        d='M12 10.2v3.92h5.46c-.24 1.24-1.47 3.62-5.46 3.62-3.29 0-5.98-2.73-5.98-6.09S8.71 5.56 12 5.56c1.87 0 3.13.79 3.85 1.47l2.62-2.53C17.1 2.78 14.74 1.8 12 1.8 6.7 1.8 2.4 6.11 2.4 11.41S6.7 21.02 12 21.02c6.94 0 9.6-4.83 9.6-8.04 0-.54-.06-.95-.13-1.37H12z'
      ></path>
      <path
        fill='#34A853'
        d='M3.19 7.36l3.2 2.35C7.17 7.86 9.38 6.38 12 6.38c1.87 0 3.13.79 3.85 1.47l2.62-2.53C17.1 3.6 14.74 2.62 12 2.62 8.3 2.62 5.07 4.7 3.19 7.36z'
        opacity='.001'
      ></path>
    </svg>
  );
}

export function AppleIcon(props: IconProps) {
  const className = props.className
    ? `${iconBase} ${props.className}`
    : iconBase;
  return (
    <svg
      viewBox='0 0 24 24'
      width='1em'
      height='1em'
      aria-hidden='true'
      {...props}
      className={className}
    >
      <path
        fill='currentColor'
        d='M16.365 13.22c.033 3.554 3.123 4.74 3.158 4.756-.026.086-.494 1.688-1.632 3.344-.982 1.42-2.004 2.835-3.618 2.864-1.582.028-2.09-.925-3.897-.925-1.807 0-2.38.897-3.882.953-1.561.06-2.75-1.536-3.74-2.951-2.034-2.922-3.588-8.265-1.5-11.872 1.034-1.798 2.891-2.94 4.904-2.97 1.53-.03 2.973 1.036 3.897 1.036.925 0 2.68-1.279 4.517-1.093.769.032 2.933.311 4.317 2.34-.112.07-2.583 1.51-2.524 4.519z'
      ></path>
      <path
        fill='currentColor'
        d='M14.147 3.584c.862-1.044 1.44-2.494 1.28-3.934-1.237.05-2.746.823-3.635 1.866-.8.936-1.49 2.43-1.302 3.856 1.377.108 2.795-.702 3.657-1.788z'
      ></path>
    </svg>
  );
}

export * from './types';
