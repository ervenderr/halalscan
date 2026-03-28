"use client";

import { useState, useCallback } from "react";
import CameraCapture from "@/components/CameraCapture";
import ImageUpload from "@/components/ImageUpload";
import BarcodeScanner from "@/components/BarcodeScanner";
import IngredientSearch from "@/components/IngredientSearch";
import ScanResult from "@/components/ScanResult";
import LoadingSpinner from "@/components/LoadingSpinner";
import { scanText, scanImage, scanBarcode } from "@/lib/api";
import { extractTextFromImage, isConfident } from "@/lib/ocr";
import { getMadhab, addToHistory } from "@/lib/storage";
import { ClassificationResponse } from "@/lib/types";

type Tab = "scan" | "barcode" | "search";
type ScanMode = "camera" | "upload";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("scan");
  const [scanMode, setScanMode] = useState<ScanMode>("camera");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Analyzing...");
  const [result, setResult] = useState<ClassificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageScan = useCallback(async (imageBase64: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const madhab = getMadhab();

    try {
      setLoadingMessage("Reading label with OCR...");
      const ocrResult = await extractTextFromImage(imageBase64);

      let response: ClassificationResponse;

      if (isConfident(ocrResult)) {
        setLoadingMessage("Classifying ingredients...");
        response = await scanText(ocrResult.text, madhab);
      } else {
        setLoadingMessage("Using AI vision to read label...");
        response = await scanImage(imageBase64, madhab);
      }

      setResult(response);
      addToHistory("image", response.product_name || "Image scan", response, madhab);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze image. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingMessage("Looking up product...");
    const madhab = getMadhab();

    try {
      const response = await scanBarcode(barcode, madhab);
      setResult(response);
      addToHistory(
        "barcode",
        response.product_name || `Barcode: ${barcode}`,
        response,
        madhab,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("no ingredient data")) {
        setError(
          "Product found but ingredients are missing from the database. " +
          "Use the Ingredients tab to photograph the ingredient list on the back of the package."
        );
      } else if (msg.includes("not found")) {
        setError(
          "Product not in the database. " +
          "Use the Ingredients tab to photograph the ingredient list on the back of the package."
        );
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTextSearch = useCallback(async (text: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingMessage("Checking ingredients...");
    const madhab = getMadhab();

    try {
      const response = await scanText(text, madhab);
      setResult(response);
      addToHistory(
        "text",
        text.length > 40 ? text.slice(0, 40) + "..." : text,
        response,
        madhab,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check ingredients. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const resetScan = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  if (result) {
    return <ScanResult result={result} onScanAnother={resetScan} />;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "scan", label: "Ingredients" },
    { key: "barcode", label: "Barcode" },
    { key: "search", label: "Search" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-2xl font-bold text-gray-900">HalalChecker AI</h1>
        <p className="text-sm text-gray-500 mt-1">
          Scan ingredients to check halal status
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setError(null);
            }}
            disabled={loading}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && <LoadingSpinner message={loadingMessage} />}

      {/* Input components */}
      {!loading && (
        <>
          {activeTab === "scan" && (
            <div className="space-y-4">
              {/* Camera / Upload toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setScanMode("camera")}
                  className={`flex-1 py-2 text-sm rounded-md border transition-colors ${
                    scanMode === "camera"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  Camera
                </button>
                <button
                  onClick={() => setScanMode("upload")}
                  className={`flex-1 py-2 text-sm rounded-md border transition-colors ${
                    scanMode === "upload"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  Upload Image
                </button>
              </div>

              {scanMode === "camera" ? (
                <CameraCapture onCapture={handleImageScan} />
              ) : (
                <ImageUpload onUpload={handleImageScan} />
              )}
            </div>
          )}

          {activeTab === "barcode" && (
            <BarcodeScanner onScan={handleBarcodeScan} />
          )}

          {activeTab === "search" && (
            <IngredientSearch onSearch={handleTextSearch} />
          )}
        </>
      )}
    </div>
  );
}
