/**
 * Inline banner for error, success, or info text.
 * Renders nothing when `message` is empty, so pages can always pass `error ?? ''`
 * without extra conditionals.
 */
type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  message: string;
}

const variantClass: Record<AlertVariant, string> = {
  error: 'alert-error',
  success: 'alert-success',
  info: 'alert-info',
};

export function Alert({ variant = 'info', message }: AlertProps) {
  if (!message) return null;
  return <div className={`alert ${variantClass[variant]}`} role="alert">{message}</div>;
}
