"use client";

import { useState } from "react";
import { Madhab, Theme, MADHAB_LABELS } from "@/lib/types";
import { getSettings, saveSettings, applyTheme } from "@/lib/storage";

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

const THEME_OPTIONS: { key: Theme; label: string; icon: React.ReactNode }[] = [
  {
    key: "light",
    label: "Light",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    key: "system",
    label: "System",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
  },
  {
    key: "dark",
    label: "Dark",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  const [settings, setSettingsState] = useState(() => {
    if (typeof window === "undefined") return { madhab: "hanafi" as Madhab, theme: "system" as Theme };
    const s = getSettings();
    return { madhab: s.madhab, theme: s.theme };
  });
  const { madhab, theme } = settings;

  const handleMadhabChange = (newMadhab: Madhab) => {
    setSettingsState((prev) => ({ ...prev, madhab: newMadhab }));
    saveSettings({ madhab: newMadhab, theme });
  };

  const handleThemeChange = (newTheme: Theme) => {
    setSettingsState((prev) => ({ ...prev, theme: newTheme }));
    saveSettings({ madhab, theme: newTheme });
    applyTheme(newTheme);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pt-3">
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Customize your experience
        </p>
      </div>

      {/* Theme selector */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Appearance</h2>
        <div
          className="relative flex p-1 rounded-xl"
          style={{ background: "var(--bg-muted)" }}
        >
          {/* Sliding indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out"
            style={{
              width: `calc((100% - 8px) / 3)`,
              left: `calc(4px + ${THEME_OPTIONS.findIndex((t) => t.key === theme)} * (100% - 8px) / 3)`,
              background: "var(--bg-card)",
              boxShadow: "var(--shadow-sm)",
            }}
          />
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleThemeChange(opt.key)}
              className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200"
              style={{
                color: theme === opt.key ? "var(--color-primary)" : "var(--text-muted)",
              }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "var(--border-default)" }} />

      {/* Madhab selector */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          Madhab (School of Thought)
        </h2>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Choose your school of thought for ingredient rulings
        </p>
        <div className="space-y-2.5">
          {(Object.entries(MADHAB_LABELS) as [Madhab, string][]).map(
            ([key, label]) => {
              const isSelected = madhab === key;
              return (
                <button
                  key={key}
                  onClick={() => handleMadhabChange(key)}
                  className="glass-card w-full text-left p-4 press-scale transition-all duration-200"
                  style={{
                    borderColor: isSelected ? "var(--color-primary)" : undefined,
                    borderWidth: isSelected ? "2px" : undefined,
                    background: isSelected ? "var(--color-halal-bg)" : "var(--bg-card)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--color-primary)" }}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
                    {MADHAB_DESCRIPTIONS[key]}
                  </p>
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="rounded-xl p-4 text-sm"
        style={{
          background: "var(--color-mushbooh-bg)",
          border: "1px solid var(--color-mushbooh-light)",
        }}
      >
        <div className="flex gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-mushbooh)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="font-medium" style={{ color: "var(--color-mushbooh)" }}>Disclaimer</p>
            <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
              This app provides guidance only and is not a substitute for a fatwa
              or consultation with qualified Islamic scholars. When in doubt,
              consult your local authority.
            </p>
          </div>
        </div>
      </div>

      {/* About section */}
      <div
        className="rounded-xl p-4 text-center text-xs space-y-1"
        style={{ color: "var(--text-muted)" }}
      >
        <p className="font-medium">HalalChecker AI</p>
        <p>Version 0.1.0</p>
        <p>AI-powered halal ingredient scanner</p>
      </div>
    </div>
  );
}
