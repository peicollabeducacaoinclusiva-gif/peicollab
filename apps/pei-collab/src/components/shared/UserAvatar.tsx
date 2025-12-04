import { cn } from "@/lib/utils";

interface Props {
  emoji?: string | null;
  color?: string | null;
  fallbackName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-lg",
  md: "h-12 w-12 text-2xl",
  lg: "h-16 w-16 text-4xl",
  xl: "h-24 w-24 text-5xl",
};

const colorMap: Record<string, { light: string; dark: string }> = {
  blue: { light: "#3b82f6", dark: "#2563eb" },
  green: { light: "#22c55e", dark: "#16a34a" },
  purple: { light: "#a855f7", dark: "#9333ea" },
  orange: { light: "#f97316", dark: "#ea580c" },
  pink: { light: "#ec4899", dark: "#db2777" },
  teal: { light: "#14b8a6", dark: "#0d9488" },
  indigo: { light: "#6366f1", dark: "#4f46e5" },
  red: { light: "#ef4444", dark: "#dc2626" },
  yellow: { light: "#eab308", dark: "#ca8a04" },
  cyan: { light: "#06b6d4", dark: "#0891b2" },
  gray: { light: "#6b7280", dark: "#4b5563" },
};

export default function UserAvatar({
  emoji,
  color = "blue",
  fallbackName,
  size = "md",
  className,
}: Props) {
  const hasEmoji = emoji && emoji !== "👤";
  const colorData = colorMap[color || "blue"] || colorMap.blue;
  
  // Debug: Log para verificar valores
  if (process.env.NODE_ENV === 'development') {
    console.log("🎨 UserAvatar:", { emoji, color, hasEmoji, fallbackName });
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shadow-md transition-all",
        sizeClasses[size],
        !hasEmoji && "bg-gradient-to-br from-primary/30 to-purple-500/30 dark:from-primary/50 dark:to-purple-500/50",
        className
      )}
      style={
        hasEmoji
          ? {
              backgroundColor: colorData.light,
            }
          : undefined
      }
    >
      {hasEmoji ? (
        <span className="select-none">{emoji}</span>
      ) : (
        <span className="font-bold text-primary dark:text-primary select-none">
          {fallbackName ? fallbackName.charAt(0).toUpperCase() : "?"}
        </span>
      )}
    </div>
  );
}

