import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function ImagePlaceholder({
  label,
  hint,
  aspect = "aspect-square",
  className,
}: {
  label: string;
  hint?: string;
  aspect?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        aspect,
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 px-3 text-center text-slate-400",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <ImageIcon className="mb-2 h-7 w-7 opacity-70" aria-hidden />
      <span className="text-xs font-semibold sm:text-sm">{label}</span>
      {hint ? <span className="mt-1 text-[11px] text-slate-400/80">{hint}</span> : null}
    </div>
  );
}
