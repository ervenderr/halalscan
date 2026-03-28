import { AppSettings, Madhab, ScanHistoryItem, ClassificationResponse } from "./types";

const SETTINGS_KEY = "halalchecker_settings";
const HISTORY_KEY = "halalchecker_history";

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return { madhab: "hanafi" };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return { madhab: "hanafi" };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getMadhab(): Madhab {
  return getSettings().madhab;
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
