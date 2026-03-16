"use client";

import { clsx } from "clsx";
import { Flame } from "lucide-react";

interface ViralScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function ViralScoreBadge({ score, size = "sm", showIcon = true }: ViralScoreBadgeProps) {
  const level = score >= 80 ? "high" : score >= 50 ? "medium" : "low";

  const colors = {
    high:   "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low:    "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span className={clsx("badge border font-semibold", colors[level], sizes[size])}>
      {showIcon && <Flame className="w-3 h-3 mr-1" />}
      {Math.round(score)}
    </span>
  );
}
