"use client";

import { useState } from "react";
import { ScanHistoryItem, Status } from "@/lib/types";
import { getHistory, clearHistory, removeHistoryItem } from "@/lib/storage";
import StatusBadge from "@/components/StatusBadge";
import ScanResult from "@/components/ScanResult";

const SCAN_TYPE_ICONS: Record<string, React.ReactNode> = {
  image: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  ),
  barcode: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
    </svg>
  ),
  text: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
};

const BORDER_COLORS: Record<Status, string> = {
  halal: "#16a34a",
  haram: "#dc2626",
  mushbooh: "#d97706",
};

function groupByDate(items: ScanHistoryItem[]): Map<string, ScanHistoryItem[]> {
  const groups = new Map<string, ScanHistoryItem[]>();
  for (const item of items) {
    const date = new Date(item.created_at).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const existing = groups.get(date) || [];
    existing.push(item);
    groups.set(date, existing);
  }
  return groups;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    return getHistory();
  });
  const [selected, setSelected] = useState<ScanHistoryItem | null>(null);

  const handleClear = () => {
    if (confirm("Clear all scan history?")) {
      clearHistory();
      setHistory([]);
    }
  };

  const handleRemoveItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeHistoryItem(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  if (selected) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm font-medium press-scale"
          style={{ color: "var(--color-primary)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to History
        </button>
        <ScanResult
          result={selected.result}
          onScanAnother={() => setSelected(null)}
        />
      </div>
    );
  }

  const grouped = groupByDate(history);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between pt-3">
        <h1 className="text-2xl font-bold gradient-text">Scan History</h1>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm font-medium press-scale"
            style={{ color: "var(--color-haram)" }}
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          {/* Empty state illustration */}
          <div className="flex justify-center">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: "var(--bg-muted)" }}
            >
              <svg className="w-12 h-12" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>No scans yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Your scan results will appear here
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([date, items]) => (
            <div key={date} className="space-y-2">
              {/* Date header */}
              <p
                className="text-xs font-medium uppercase tracking-wider px-1 sticky top-0 py-1 z-10"
                style={{ color: "var(--text-muted)", background: "var(--bg-primary)" }}
              >
                {date}
              </p>
              <div className="space-y-2 stagger-fade-in">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="glass-card w-full text-left p-4 press-scale group relative overflow-hidden cursor-pointer"
                    style={{ borderLeft: `4px solid ${BORDER_COLORS[item.result.overall_status]}` }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(item); } }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Scan type icon */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
                        >
                          {SCAN_TYPE_ICONS[item.scan_type]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {item.input_summary}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" \u00b7 "}
                            {item.madhab}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={item.result.overall_status} size="sm" />
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleRemoveItem(e, item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md"
                          style={{ color: "var(--text-muted)" }}
                          aria-label="Delete scan"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
