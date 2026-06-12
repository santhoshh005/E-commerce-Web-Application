import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, type = "text", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-txt">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={`input-field ${error ? "border-error-brand focus:border-error-brand focus:ring-red-500/20" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs font-semibold text-error-brand animate-fade-in-up">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
