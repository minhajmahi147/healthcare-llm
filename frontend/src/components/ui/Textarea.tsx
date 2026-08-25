/**
 * Labeled multiline text field. Used on the health profile for disease notes
 * and additional info. Forwards native <textarea> attributes.
 */
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <label className="field" htmlFor={textareaId}>
      <span className="field-label">{label}</span>
      <textarea id={textareaId} className={`field-input field-textarea ${className}`.trim()} {...props} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
