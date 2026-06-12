import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-2xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
    
    const variants = {
      primary: "bg-primary-brand text-primary-brand-foreground hover:bg-primary-brand-hover focus:ring-primary-brand",
      secondary: "bg-muted-bg text-foreground hover:bg-border-brand focus:ring-muted-txt",
      outline: "border border-border-brand bg-transparent text-foreground hover:bg-muted-bg focus:ring-primary-brand",
      ghost: "bg-transparent text-foreground hover:bg-muted-bg hover:text-foreground focus:ring-primary-brand",
      danger: "bg-error-brand text-white hover:bg-red-700 focus:ring-red-500",
      gold: "bg-gold-brand text-primary-brand-foreground hover:bg-gold-brand-hover focus:ring-gold-brand",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-xl",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base rounded-[1.25rem]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
