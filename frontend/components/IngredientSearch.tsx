"use client";

import { useState, useCallback } from "react";

interface IngredientSearchProps {
  onSearch: (text: string) => void;
  disabled?: boolean;
}

export default function IngredientSearch({
  onSearch,
  disabled = false,
}: IngredientSearchProps) {
  const [text, setText] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed) return;
      onSearch(trimmed);
    },
    [text, onSearch],
  );

  const quickExamples = [
    "gelatin",
    "E471",
    "carmine",
    "whey",
    "natural flavors",
    "lecithin",
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          placeholder="Type ingredients to check, e.g.:&#10;sugar, gelatin, E471, natural flavors"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          rows={4}
          className="w-full px-4 py-3 rounded-xl resize-none transition-all duration-200"
          style={{
            background: "var(--bg-input)",
            border: "1.5px solid var(--border-card)",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-sm)",
          }}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="w-full py-3.5 btn-primary rounded-xl font-medium press-scale disabled:cursor-not-allowed"
        >
          Check Ingredients
        </button>
      </form>

      {/* Quick check chips */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Quick check:</p>
        <div className="flex flex-wrap gap-2">
          {quickExamples.map((example) => (
            <button
              key={example}
              onClick={() => onSearch(example)}
              disabled={disabled}
              className="px-3.5 py-1.5 rounded-full text-sm press-scale disabled:opacity-50 transition-all duration-200 hover:shadow-md"
              style={{
                background: "var(--bg-card)",
                border: "1.5px solid var(--border-card)",
                color: "var(--text-secondary)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
