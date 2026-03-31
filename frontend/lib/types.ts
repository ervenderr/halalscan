export type Madhab = "hanafi" | "shafii" | "maliki" | "hanbali";
export type Status = "halal" | "haram" | "mushbooh";

export interface IngredientResult {
  name: string;
  status: Status;
  confidence: number;
  explanation: string;
  e_number: string | null;
  source_reference: string | null;
  madhab_note: string | null;
}

export interface ClassificationResponse {
  product_name: string | null;
  overall_status: Status;
  ingredients: IngredientResult[];
  summary: string;
  recommendation: string;
}

export interface ScanHistoryItem {
  id: string;
  scan_type: "text" | "image" | "barcode";
  input_summary: string;
  result: ClassificationResponse;
  madhab: Madhab;
  created_at: string;
}

export type Theme = "light" | "dark" | "system";

export interface AppSettings {
  madhab: Madhab;
  theme: Theme;
}

export const MADHAB_LABELS: Record<Madhab, string> = {
  hanafi: "Hanafi",
  shafii: "Shafi'i",
  maliki: "Maliki",
  hanbali: "Hanbali",
};

export const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; emoji: string }
> = {
  halal: {
    label: "Halal",
    color: "text-green-700",
    bg: "bg-green-100",
    emoji: "",
  },
  haram: {
    label: "Haram",
    color: "text-red-700",
    bg: "bg-red-100",
    emoji: "",
  },
  mushbooh: {
    label: "Mushbooh",
    color: "text-amber-700",
    bg: "bg-amber-100",
    emoji: "",
  },
};
