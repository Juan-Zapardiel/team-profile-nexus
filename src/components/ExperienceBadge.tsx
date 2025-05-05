
import { cn, getExperienceLevel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ExperienceBadgeProps {
  count: number;
  label: string;
  colorClass?: string;
}

export function ExperienceBadge({ count, label, colorClass = "bg-blue-500" }: ExperienceBadgeProps) {
  const level = getExperienceLevel(count);
  
  return (
    <div className="flex items-center gap-3">
      <Badge className={cn("text-xs", colorClass)}>
        {level}
      </Badge>
      <span className="text-sm">
        {count} {label}
      </span>
    </div>
  );
}
