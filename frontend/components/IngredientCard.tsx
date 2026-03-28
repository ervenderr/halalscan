"use client";

import { useState } from "react";
import { IngredientResult } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface IngredientCardProps {
  ingredient: IngredientResult;
}

export default function IngredientCard({ ingredient }: IngredientCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900 capitalize">
            {ingredient.name}
          </h3>
          {ingredient.e_number && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {ingredient.e_number}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {Math.round(ingredient.confidence * 100)}%
          </span>
          <StatusBadge status={ingredient.status} size="sm" />
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t text-sm space-y-2">
          <p className="text-gray-700">{ingredient.explanation}</p>
          {ingredient.madhab_note && (
            <p className="text-blue-700 bg-blue-50 px-3 py-2 rounded text-xs">
              Other schools: {ingredient.madhab_note}
            </p>
          )}
          {ingredient.source_reference && (
            <p className="text-gray-400 text-xs">
              Source: {ingredient.source_reference}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
