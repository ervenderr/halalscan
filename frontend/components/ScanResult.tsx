"use client";

import { ClassificationResponse, Status } from "@/lib/types";
import IngredientCard from "./IngredientCard";
import StatusBadge from "./StatusBadge";

interface ScanResultProps {
  result: ClassificationResponse;
  onScanAnother: () => void;
}

const STATUS_HERO: Record<Status, { gradient: string; icon: React.ReactNode }> = {
  halal: {
    gradient: "status-gradient-halal",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
          style={{ strokeDasharray: 24, animation: "drawCheck 0.5s ease-out 0.3s both" }}
        />
      </svg>
    ),
  },
  haram: {
    gradient: "status-gradient-haram",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6"
          style={{ strokeDasharray: 20, animation: "drawX 0.4s ease-out 0.3s both" }}
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 6l12 12"
          style={{ strokeDasharray: 20, animation: "drawX 0.4s ease-out 0.5s both" }}
        />
      </svg>
    ),
  },
  mushbooh: {
    gradient: "status-gradient-mushbooh",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          style={{ strokeDasharray: 60, animation: "drawCheck 0.6s ease-out 0.3s both" }}
        />
      </svg>
    ),
  },
};

const STATUS_RING_COLORS: Record<Status, string> = {
  halal: "rgba(22, 163, 74, 0.2)",
  haram: "rgba(220, 38, 38, 0.2)",
  mushbooh: "rgba(217, 119, 6, 0.2)",
};

export default function ScanResult({ result, onScanAnother }: ScanResultProps) {
  const hero = STATUS_HERO[result.overall_status];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero section */}
      <div className={`${hero.gradient} rounded-2xl p-6 text-center space-y-4`}>
        {/* Status icon */}
        <div className="flex justify-center">
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "var(--bg-card)" }}
          >
            {/* Pulse ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: `3px solid ${STATUS_RING_COLORS[result.overall_status]}`,
                animation: "pulseRing 2s ease-out infinite",
              }}
            />
            {hero.icon}
          </div>
        </div>

        {result.product_name && (
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {result.product_name}
          </h2>
        )}

        <StatusBadge status={result.overall_status} size="lg" />
      </div>

      {/* Summary card */}
      <div className="glass-card p-4 space-y-2">
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {result.summary}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {result.recommendation}
        </p>
      </div>

      {/* Ingredients */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          Ingredients ({result.ingredients.length})
        </h3>
        <div className="space-y-2 stagger-fade-in">
          {result.ingredients.map((ingredient, index) => (
            <IngredientCard key={index} ingredient={ingredient} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={onScanAnother}
        className="w-full py-3.5 btn-primary rounded-xl font-medium press-scale"
      >
        Scan Another Product
      </button>
    </div>
  );
}
