"use client";

import { ClassificationResponse } from "@/lib/types";
import IngredientCard from "./IngredientCard";
import StatusBadge from "./StatusBadge";

interface ScanResultProps {
  result: ClassificationResponse;
  onScanAnother: () => void;
}

export default function ScanResult({ result, onScanAnother }: ScanResultProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        {result.product_name && (
          <h2 className="text-xl font-semibold text-gray-900">
            {result.product_name}
          </h2>
        )}
        <StatusBadge status={result.overall_status} size="lg" />
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-700">{result.summary}</p>
        <p className="text-sm text-gray-500 mt-2">{result.recommendation}</p>
      </div>

      {/* Ingredients */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">
          Ingredients ({result.ingredients.length})
        </h3>
        <div className="space-y-2">
          {result.ingredients.map((ingredient, index) => (
            <IngredientCard key={index} ingredient={ingredient} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={onScanAnother}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
      >
        Scan Another Product
      </button>
    </div>
  );
}
