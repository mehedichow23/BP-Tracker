import { cn } from "@/lib/utils";
import {
  BP_CATEGORY_CLASSES,
  BP_CATEGORY_LABELS,
  categorizeBP,
} from "@/lib/bp-category";

export function BPBadge({
  systolic,
  diastolic,
  className,
}: {
  systolic: number;
  diastolic: number;
  className?: string;
}) {
  const category = categorizeBP(systolic, diastolic);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        BP_CATEGORY_CLASSES[category],
        className
      )}
    >
      {BP_CATEGORY_LABELS[category]}
    </span>
  );
}
