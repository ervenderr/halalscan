import { ClassificationResponse, Madhab } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(body.detail || `Request failed: ${response.status}`, response.status);
  }

  return response.json();
}

export async function scanText(
  text: string,
  madhab: Madhab,
): Promise<ClassificationResponse> {
  return request<ClassificationResponse>("/api/scan/text", {
    method: "POST",
    body: JSON.stringify({ text, madhab }),
  });
}

export async function scanImage(
  imageBase64: string,
  madhab: Madhab,
): Promise<ClassificationResponse> {
  return request<ClassificationResponse>("/api/scan/image", {
    method: "POST",
    body: JSON.stringify({ image: imageBase64, madhab }),
  });
}

export async function scanBarcode(
  barcode: string,
  madhab: Madhab,
): Promise<ClassificationResponse> {
  return request<ClassificationResponse>("/api/barcode", {
    method: "POST",
    body: JSON.stringify({ barcode, madhab }),
  });
}

export async function checkHealth(): Promise<boolean> {
  try {
    await request("/api/health");
    return true;
  } catch {
    return false;
  }
}
