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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Ingredients
        </button>
      </form>

      {/* Quick check chips */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Quick check:</p>
        <div className="flex flex-wrap gap-2">
          {quickExamples.map((example) => (
            <button
              key={example}
              onClick={() => onSearch(example)}
              disabled={disabled}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
