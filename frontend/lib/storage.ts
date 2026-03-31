import { AppSettings, Madhab, Theme, ScanHistoryItem, ClassificationResponse } from "./types";

const SETTINGS_KEY = "halalchecker_settings";
const HISTORY_KEY = "halalchecker_history";
const ONBOARDING_KEY = "halalchecker_onboarding";

const DEFAULT_SETTINGS: AppSettings = { madhab: "hanafi", theme: "system" };

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getMadhab(): Madhab {
  return getSettings().madhab;
}

export function getTheme(): Theme {
  return getSettings().theme;
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
    root.classList.remove("light-forced");
  } else {
    root.classList.toggle("dark", theme === "dark");
    // When user explicitly picks light, override the CSS media query fallback
    root.classList.toggle("light-forced", theme === "light");
  }
}

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function setOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

export function removeHistoryItem(id: string): void {
  const history = getHistory();
  const updated = history.filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function getHistory(): ScanHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return [];
}

export function addToHistory(
  scanType: "text" | "image" | "barcode",
  inputSummary: string,
  result: ClassificationResponse,
  madhab: Madhab,
): void {
  const history = getHistory();
  const item: ScanHistoryItem = {
    id: crypto.randomUUID(),
    scan_type: scanType,
    input_summary: inputSummary,
    result,
    madhab,
    created_at: new Date().toISOString(),
  };
  const updated = [item, ...history].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
