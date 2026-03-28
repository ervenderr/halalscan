"use client";

import { Status, STATUS_CONFIG } from "@/lib/types";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md" | "lg";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}
