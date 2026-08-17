import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "secondary";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
    destructive: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
    secondary: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
