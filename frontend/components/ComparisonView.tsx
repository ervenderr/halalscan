"use client";

import { ClassificationResponse, Status } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface ComparisonViewProps {
  slotA: ClassificationResponse;
  slotB: ClassificationResponse;
}

const STATUS_RANK: Record<Status, number> = { halal: 0, mushbooh: 1, haram: 2 };

function getWinner(a: Status, b: Status): "A" | "B" | "tie" {
  if (a === b) return "tie";
  return STATUS_RANK[a] < STATUS_RANK[b] ? "A" : "B";
}

export default function ComparisonView({ slotA, slotB }: ComparisonViewProps) {
  const winner = getWinner(slotA.overall_status, slotB.overall_status);

  const statsA = {
    halal: slotA.ingredients.filter((i) => i.status === "halal").length,
    haram: slotA.ingredients.filter((i) => i.status === "haram").length,
    mushbooh: slotA.ingredients.filter((i) => i.status === "mushbooh").length,
  };
  const statsB = {
    halal: slotB.ingredients.filter((i) => i.status === "halal").length,
    haram: slotB.ingredients.filter((i) => i.status === "haram").length,
    mushbooh: slotB.ingredients.filter((i) => i.status === "mushbooh").length,
  };

  // Find shared ingredients with different statuses
  const ingredientMapA = new Map(slotA.ingredients.map((i) => [i.name.toLowerCase(), i.status]));
  const ingredientMapB = new Map(slotB.ingredients.map((i) => [i.name.toLowerCase(), i.status]));
  const differing = new Set<string>();
  for (const [name, statusA] of ingredientMapA) {
    const statusB = ingredientMapB.get(name);
    if (statusB && statusB !== statusA) differing.add(name);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Winner banner */}
      <div
        className="glass-card p-4 text-center"
        style={{
          background: winner === "tie" ? "var(--bg-muted)" : "var(--color-halal-bg)",
          borderColor: winner === "tie" ? "var(--border-card)" : "var(--color-halal-light)",
        }}
      >
        {winner === "tie" ? (
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Both products have the same overall status
          </p>
        ) : (
          <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            {winner === "A" ? (slotA.product_name || "Product A") : (slotB.product_name || "Product B")} is the better choice
          </p>
        )}
      </div>

      {/* Status comparison */}
      <div className="flex gap-3">
        <div className="flex-1 glass-card p-3 text-center space-y-2">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Product A</p>
          <StatusBadge status={slotA.overall_status} size="md" />
        </div>
        <div className="flex items-center">
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>VS</span>
        </div>
        <div className="flex-1 glass-card p-3 text-center space-y-2">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Product B</p>
          <StatusBadge status={slotB.overall_status} size="md" />
        </div>
      </div>

      {/* Stats comparison */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-2 text-center text-sm">
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>{statsA.halal}</p>
          <p className="text-xs" style={{ color: "#16a34a" }}>Halal</p>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>{statsB.halal}</p>

          <p className="font-medium" style={{ color: "var(--text-primary)" }}>{statsA.haram}</p>
          <p className="text-xs" style={{ color: "#dc2626" }}>Haram</p>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>{statsB.haram}</p>

          <p className="font-medium" style={{ color: "var(--text-primary)" }}>{statsA.mushbooh}</p>
          <p className="text-xs" style={{ color: "#d97706" }}>Doubtful</p>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>{statsB.mushbooh}</p>
        </div>
      </div>

      {/* Differing ingredients */}
      {differing.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            INGREDIENTS WITH DIFFERENT STATUS
          </h4>
          <div className="space-y-1.5">
            {Array.from(differing).map((name) => (
              <div
                key={name}
                className="glass-card p-3 flex items-center justify-between text-sm"
                style={{ borderColor: "var(--color-mushbooh-light)" }}
              >
                <span className="font-medium capitalize" style={{ color: "var(--text-primary)" }}>{name}</span>
                <div className="flex gap-2">
                  <StatusBadge status={ingredientMapA.get(name)!} size="sm" />
                  <span style={{ color: "var(--text-muted)" }}>vs</span>
                  <StatusBadge status={ingredientMapB.get(name)!} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
