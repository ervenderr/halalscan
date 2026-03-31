"use client";

import { useState } from "react";
import { ClassificationResponse } from "@/lib/types";
import { getHistory } from "@/lib/storage";
import StatusBadge from "@/components/StatusBadge";
import ProductSlot from "@/components/ProductSlot";
import ComparisonView from "@/components/ComparisonView";
import Link from "next/link";

export default function ComparePage() {
  const [slotA, setSlotA] = useState<ClassificationResponse | null>(null);
  const [slotB, setSlotB] = useState<ClassificationResponse | null>(null);
  const [selectingFor, setSelectingFor] = useState<"A" | "B" | null>(null);

  const history = typeof window !== "undefined" ? getHistory() : [];

  const handleSelect = (result: ClassificationResponse) => {
    if (selectingFor === "A") setSlotA(result);
    else if (selectingFor === "B") setSlotB(result);
    setSelectingFor(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="pt-3">
        <h1 className="text-2xl font-bold gradient-text">Compare Products</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Select two products to compare halal status
        </p>
      </div>

      {/* Product slots */}
      <div className="grid grid-cols-2 gap-3">
        <ProductSlot
          label="Product A"
          product={slotA}
          onSelect={() => setSelectingFor("A")}
          onClear={() => setSlotA(null)}
        />
        <ProductSlot
          label="Product B"
          product={slotB}
          onSelect={() => setSelectingFor("B")}
          onClear={() => setSlotB(null)}
        />
      </div>

      {/* Comparison view */}
      {slotA && slotB && <ComparisonView slotA={slotA} slotB={slotB} />}

      {/* History selection overlay */}
      {selectingFor && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectingFor(null); }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectingFor(null)} />
          <div
            className="relative w-full max-w-sm max-h-[70vh] rounded-2xl overflow-hidden flex flex-col animate-slide-in-top"
            style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-xl)", border: "1px solid var(--border-card)" }}
          >
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Select Product {selectingFor}
              </h3>
              <button
                onClick={() => setSelectingFor(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center press-scale"
                style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-3 space-y-2 flex-1">
              {history.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--bg-muted)" }}
                  >
                    <svg className="w-8 h-8" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No scans yet</p>
                  <Link
                    href="/"
                    className="inline-block text-sm font-medium press-scale"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Scan a product first
                  </Link>
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.result)}
                    className="glass-card w-full text-left p-3.5 press-scale flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {item.input_summary}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {new Date(item.created_at).toLocaleDateString()} · {item.madhab}
                      </p>
                    </div>
                    <StatusBadge status={item.result.overall_status} size="sm" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
