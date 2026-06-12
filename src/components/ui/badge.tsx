import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "success" | "warning" | "danger" | "gold" | "status";
  statusType?: "PENDING" | "PAID" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | string;
  className?: string;
};

export function Badge({ children, variant = "primary", statusType, className = "" }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors";
  
  const variants = {
    primary: "bg-primary-brand text-primary-brand-foreground",
    secondary: "bg-muted-bg text-muted-txt border border-border-brand",
    outline: "border border-border-brand text-foreground bg-transparent",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    gold: "bg-gold-brand-light text-gold-brand border border-gold-brand/20 dark:bg-gold-brand/10",
    status: "", // Set dynamically below
  };

  let variantStyle = variants[variant];

  if (variant === "status" && statusType) {
    switch (statusType) {
      case "PENDING":
        variantStyle = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-900/30";
        break;
      case "PAID":
        variantStyle = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30";
        break;
      case "PACKING":
        variantStyle = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30";
        break;
      case "SHIPPED":
        variantStyle = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30";
        break;
      case "DELIVERED":
        variantStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30";
        break;
      case "CANCELLED":
        variantStyle = "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30";
        break;
      default:
        variantStyle = "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
    }
  }

  return (
    <span className={`${baseStyles} ${variantStyle} ${className}`}>
      {children}
    </span>
  );
}
