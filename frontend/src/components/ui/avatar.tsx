import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  statusDot?: "online" | "offline" | "away" | "busy";
}

export function Avatar({ src, name, size = "md", statusDot, className, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const initials = React.useMemo(() => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs font-bold",
    md: "h-10 w-10 text-sm font-bold",
    lg: "h-12 w-12 text-base font-bold",
    xl: "h-14 w-14 text-lg font-extrabold",
  };

  const statusColors = {
    online: "bg-emerald-500 ring-2 ring-white dark:ring-slate-900",
    offline: "bg-slate-400 ring-2 ring-white dark:ring-slate-900",
    away: "bg-amber-500 ring-2 ring-white dark:ring-slate-900",
    busy: "bg-rose-500 ring-2 ring-white dark:ring-slate-900",
  };

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xs select-none transition-transform duration-200 hover:scale-105",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name || "User avatar"}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {statusDot && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full",
            statusColors[statusDot]
          )}
        />
      )}
    </div>
  );
}
