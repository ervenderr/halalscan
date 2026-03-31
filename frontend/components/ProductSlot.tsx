"use client";

import { ClassificationResponse } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface ProductSlotProps {
  label: string;
  product: ClassificationResponse | null;
  onSelect: () => void;
  onClear: () => void;
}

export default function ProductSlot({ label, product, onSelect, onClear }: ProductSlotProps) {
  if (!product) {
    return (
      <button
        onClick={onSelect}
        className="glass-card glass-card-lift w-full p-6 flex flex-col items-center gap-3 press-scale"
        style={{ borderStyle: "dashed" }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-muted)" }}
        >
          <svg className="w-6 h-6" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>From scan history</p>
        </div>
      </button>
    );
  }

  const halal = product.ingredients.filter((i) => i.status === "halal").length;
  const haram = product.ingredients.filter((i) => i.status === "haram").length;
  const mushbooh = product.ingredients.filter((i) => i.status === "mushbooh").length;

  return (
    <div className="glass-card w-full p-4 relative">
      <button
        onClick={onClear}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center press-scale"
        style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
        aria-label="Clear selection"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="space-y-2.5">
        <p className="font-medium text-sm truncate pr-6" style={{ color: "var(--text-primary)" }}>
          {product.product_name || "Scanned Product"}
        </p>
        <StatusBadge status={product.overall_status} size="sm" />
        <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          {halal > 0 && <span style={{ color: "#16a34a" }}>{halal} halal</span>}
          {haram > 0 && <span style={{ color: "#dc2626" }}>{haram} haram</span>}
          {mushbooh > 0 && <span style={{ color: "#d97706" }}>{mushbooh} doubtful</span>}
        </div>
      </div>
    </div>
  );
}
