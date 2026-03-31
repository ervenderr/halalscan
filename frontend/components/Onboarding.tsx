"use client";

import { useState } from "react";
import Image from "next/image";
import { Madhab, MADHAB_LABELS } from "@/lib/types";
import { saveSettings, setOnboardingComplete } from "@/lib/storage";

interface OnboardingProps {
  onComplete: () => void;
}

const MADHAB_DESCRIPTIONS: Record<Madhab, string> = {
  hanafi: "Most widely followed. Permits seafood only with scales.",
  shafii: "All seafood is halal. Stricter on alcohol in processing.",
  maliki: "All seafood halal. More lenient on insect-derived ingredients.",
  hanbali: "All seafood halal. Stricter on doubtful ingredients.",
};

const SCAN_METHODS = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
    title: "Scan Ingredients",
    desc: "Point your camera at the ingredient list on any food package",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
      </svg>
    ),
    title: "Scan Barcode",
    desc: "Look up products instantly from a database of 4M+ items",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: "Search Ingredients",
    desc: "Type any ingredient name for instant halal classification",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [madhab, setMadhab] = useState<Madhab>("hanafi");

  const finish = () => {
    saveSettings({ madhab, theme: "system" });
    setOnboardingComplete();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: s === step ? 24 : 8,
                background: s <= step ? "var(--color-primary)" : "var(--border-default)",
              }}
            />
          ))}
        </div>

        {/* Skip button */}
        <div className="flex justify-end">
          <button
            onClick={finish}
            className="text-xs font-medium press-scale"
            style={{ color: "var(--text-muted)" }}
          >
            Skip
          </button>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-5 animate-fade-in" key="step1">
            <div className="flex justify-center">
              <Image
                src="/halalchecker-log.png"
                alt="HalalChecker AI"
                width={80}
                height={80}
                className="drop-shadow-lg"
                style={{ borderRadius: "50%", objectFit: "cover" }}
                priority
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold gradient-text">HalalChecker AI</h1>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Instantly check if food ingredients are halal using AI
                and a database of 3,300+ ingredients with madhab-specific rulings.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 btn-primary rounded-xl font-medium press-scale"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Step 2: Choose Madhab */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in" key="step2">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Choose Your Madhab
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Rulings differ across schools — you can change this later in Settings
              </p>
            </div>

            <div className="space-y-2">
              {(Object.entries(MADHAB_LABELS) as [Madhab, string][]).map(([key, label]) => {
                const isSelected = madhab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setMadhab(key)}
                    className="glass-card w-full text-left p-3.5 press-scale transition-all duration-200"
                    style={{
                      borderColor: isSelected ? "var(--color-primary)" : undefined,
                      borderWidth: isSelected ? "2px" : undefined,
                      background: isSelected ? "var(--color-halal-bg)" : "var(--bg-card)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{label}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {MADHAB_DESCRIPTIONS[key]}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-3.5 btn-primary rounded-xl font-medium press-scale"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: How to Scan */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in" key="step3">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Three Ways to Check
              </h2>
            </div>

            <div className="space-y-3">
              {SCAN_METHODS.map((method, i) => (
                <div
                  key={i}
                  className="glass-card p-4 flex items-start gap-3.5"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                      border: "1px solid #a7f3d0",
                      color: "var(--color-primary)",
                    }}
                  >
                    {method.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                      {method.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {method.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={finish}
              className="w-full py-3.5 btn-primary rounded-xl font-medium press-scale"
            >
              Start Scanning
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
