"use client";

import { Status, STATUS_CONFIG } from "@/lib/types";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md" | "lg";
}

const STATUS_ICONS: Record<Status, React.ReactNode> = {
  halal: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  haram: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  mushbooh: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
};

const STATUS_COLORS: Record<Status, { text: string; bg: string; border: string }> = {
  halal: { text: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  haram: { text: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  mushbooh: { text: "#a16207", bg: "#fffbeb", border: "#fde68a" },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const colors = STATUS_COLORS[status];

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-5 py-2.5 text-base font-semibold gap-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        color: colors.text,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {STATUS_ICONS[status]}
      {config.label}
    </span>
  );
}
