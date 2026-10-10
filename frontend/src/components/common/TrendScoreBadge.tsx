import { getScoreColor } from "@/utils/format";

interface TrendScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function TrendScoreBadge({ score, size = "md" }: TrendScoreBadgeProps) {
  const colorClasses = getScoreColor(score);
  const sizeClasses = {
    sm: "text-xs min-w-[2rem] px-1.5 py-0.5",
    md: "text-sm min-w-[2.5rem] px-2 py-0.5",
    lg: "text-lg min-w-[3rem] px-3 py-1",
  };

  return (
    <span className={`score-badge ${colorClasses} ${sizeClasses[size]}`}>
      {score}
    </span>
  );
}
