import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/** Campo de formulario para las páginas de auth (viven sobre el fondo fijo del sidebar). */
export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-tb-sidebar-text">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1.5 w-full rounded-lg border border-tb-sidebar-border bg-tb-sidebar-bg px-3 py-2 text-sm text-tb-sidebar-text placeholder:text-tb-sidebar-muted"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-tb-sidebar-danger">
          {error}
        </p>
      )}
    </div>
  );
}
