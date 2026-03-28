import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
}

const CONFIDENCE_THRESHOLD = 50;

export async function extractTextFromImage(
  imageBase64: string,
): Promise<OcrResult> {
  const dataUrl = `data:image/jpeg;base64,${imageBase64}`;

  const result = await Tesseract.recognize(dataUrl, "eng", {
    logger: () => {},
  });

  return {
    text: result.data.text.trim(),
    confidence: result.data.confidence,
  };
}

export function isConfident(result: OcrResult): boolean {
  return result.confidence >= CONFIDENCE_THRESHOLD && result.text.length > 10;
}
