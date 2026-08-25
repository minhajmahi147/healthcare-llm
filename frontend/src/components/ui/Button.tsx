/**
 * Shared button used in forms, nav logout, and actions.
 * Supports primary / secondary / ghost styles and a `loading` prop that disables
 * the control and shows “Please wait…”.
 */
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn ${variantClass[variant]} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
