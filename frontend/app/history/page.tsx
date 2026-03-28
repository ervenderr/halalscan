"use client";

import { useState, useEffect } from "react";
import { ScanHistoryItem } from "@/lib/types";
import { getHistory, clearHistory } from "@/lib/storage";
import StatusBadge from "@/components/StatusBadge";
import ScanResult from "@/components/ScanResult";

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [selected, setSelected] = useState<ScanHistoryItem | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    if (confirm("Clear all scan history?")) {
      clearHistory();
      setHistory([]);
    }
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="text-green-600 text-sm font-medium"
        >
          &larr; Back to History
        </button>
        <ScanResult
          result={selected.result}
          onScanAnother={() => setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No scans yet</p>
          <p className="text-sm mt-1">
            Your scan results will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="w-full text-left bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {item.input_summary}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.created_at).toLocaleDateString()} &middot;{" "}
                    {item.scan_type} &middot; {item.madhab}
                  </p>
                </div>
                <StatusBadge status={item.result.overall_status} size="sm" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
