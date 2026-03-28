"use client";

import { useState, useEffect } from "react";
import { Madhab, MADHAB_LABELS } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/storage";

const MADHAB_DESCRIPTIONS: Record<Madhab, string> = {
  hanafi:
    "Most widely followed. Permits seafood only with scales. Applies istihalah (transformation) principle more broadly.",
  shafii:
    "Second most followed. All seafood is halal. Stricter on alcohol in food processing.",
  maliki:
    "Prevalent in North/West Africa. All seafood halal. More lenient on insect-derived ingredients.",
  hanbali:
    "Most conservative school. All seafood halal. Stricter on doubtful ingredients.",
};

export default function SettingsPage() {
  const [madhab, setMadhab] = useState<Madhab>("hanafi");

  useEffect(() => {
    setMadhab(getSettings().madhab);
  }, []);

  const handleChange = (newMadhab: Madhab) => {
    setMadhab(newMadhab);
    saveSettings({ madhab: newMadhab });
  };

  return (
    <div className="space-y-6">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose your school of thought for ingredient rulings
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Madhab (School of Thought)</h2>
        {(Object.entries(MADHAB_LABELS) as [Madhab, string][]).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => handleChange(key)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                madhab === key
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{label}</span>
                {madhab === key && (
                  <span className="text-green-600 text-sm font-medium">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {MADHAB_DESCRIPTIONS[key]}
              </p>
            </button>
          ),
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-medium">Disclaimer</p>
        <p className="mt-1">
          This app provides guidance only and is not a substitute for a fatwa
          or consultation with qualified Islamic scholars. When in doubt,
          consult your local authority.
        </p>
      </div>
    </div>
  );
}
