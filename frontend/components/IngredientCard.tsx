"use client";

import { useState } from "react";
import { IngredientResult, Status } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import FeedbackModal from "./FeedbackModal";

interface IngredientCardProps {
  ingredient: IngredientResult;
}

const BORDER_COLORS: Record<Status, string> = {
  halal: "#16a34a",
  haram: "#dc2626",
  mushbooh: "#d97706",
};

const BAR_COLORS: Record<Status, string> = {
  halal: "#16a34a",
  haram: "#dc2626",
  mushbooh: "#d97706",
};

export default function IngredientCard({ ingredient }: IngredientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const confidence = Math.round(ingredient.confidence * 100);

  return (
    <div
      className="glass-card overflow-hidden cursor-pointer"
      style={{ borderLeft: `4px solid ${BORDER_COLORS[ingredient.status]}` }}
      onClick={() => setExpanded(!expanded)}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="font-medium capitalize truncate" style={{ color: "var(--text-primary)" }}>
              {ingredient.name}
            </h3>
            {ingredient.e_number && (
              <span
                className="shrink-0 text-xs px-2 py-0.5 rounded-md"
                style={{
                  background: "var(--bg-muted)",
                  color: "var(--text-muted)",
                }}
              >
                {ingredient.e_number}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0 ml-2">
            {/* Confidence bar */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-12 h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-muted)" }}
              >
                <div
                  className="h-full rounded-full confidence-bar-fill"
                  style={{
                    width: `${confidence}%`,
                    background: BAR_COLORS[ingredient.status],
                  }}
                />
              </div>
              <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {confidence}%
              </span>
            </div>
            <StatusBadge status={ingredient.status} size="sm" />
            {/* Chevron */}
            <svg
              className={`w-4 h-4 chevron-rotate ${expanded ? "rotated" : ""}`}
              style={{ color: "var(--text-muted)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expandable content */}
      <div className={`expandable ${expanded ? "expanded" : ""}`}>
        <div>
          <div
            className="px-4 pb-4 pt-0 text-sm space-y-2.5"
            style={{ borderTop: "1px solid var(--border-default)" }}
          >
            <div className="pt-3">
              <p style={{ color: "var(--text-secondary)" }}>{ingredient.explanation}</p>
            </div>
            {ingredient.madhab_note && (
              <p
                className="px-3 py-2 rounded-lg text-xs"
                style={{
                  background: "rgba(59, 130, 246, 0.08)",
                  color: "#2563eb",
                  border: "1px solid rgba(59, 130, 246, 0.15)",
                }}
              >
                Other schools: {ingredient.madhab_note}
              </p>
            )}
            {ingredient.source_reference && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Source: {ingredient.source_reference}
              </p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowFeedback(true); }}
              className="flex items-center gap-1 text-xs font-medium press-scale pt-1"
              style={{ color: "var(--text-muted)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
              Report incorrect
            </button>
          </div>
        </div>
      </div>
      {showFeedback && (
        <FeedbackModal ingredient={ingredient} onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
