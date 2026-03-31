"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import CameraCapture from "@/components/CameraCapture";
import ImageUpload from "@/components/ImageUpload";
import BarcodeScanner from "@/components/BarcodeScanner";
import IngredientSearch from "@/components/IngredientSearch";
import ScanResult from "@/components/ScanResult";
import LoadingSpinner from "@/components/LoadingSpinner";
import Onboarding from "@/components/Onboarding";
import { scanText, scanBarcode } from "@/lib/api";
import { extractTextFromImage, isConfident } from "@/lib/ocr";
import { getMadhab, addToHistory, isOnboardingComplete } from "@/lib/storage";
import { ClassificationResponse, MADHAB_LABELS } from "@/lib/types";

type Tab = "scan" | "barcode" | "search";
type ScanMode = "camera" | "upload";

const TAB_CONFIG: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "scan",
    label: "Ingredients",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
  },
  {
    key: "barcode",
    label: "Barcode",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
      </svg>
    ),
  },
  {
    key: "search",
    label: "Search",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("scan");
  const [scanMode, setScanMode] = useState<ScanMode>("camera");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Analyzing...");
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ClassificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [barcodeFallback, setBarcodeFallback] = useState<string | null>(null);
  const [currentMadhab, setCurrentMadhab] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setCurrentMadhab(getMadhab());
    if (!isOnboardingComplete()) setShowOnboarding(true);
  }, []);

  const handleImageScan = useCallback(async (imageBase64: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setBarcodeFallback(null);
    const madhab = getMadhab();

    try {
      setLoadingStep(1);
      setLoadingMessage("Reading label with OCR...");
      const ocrResult = await extractTextFromImage(imageBase64);

      if (!ocrResult.text || ocrResult.text.length < 5) {
        throw new Error(
          "Could not read any text from the image. Please try again with a clearer photo, or use the Search tab to type ingredients manually."
        );
      }

      setLoadingStep(2);
      if (isConfident(ocrResult)) {
        setLoadingMessage("Classifying ingredients...");
      } else {
        setLoadingMessage("Text partially readable, classifying...");
      }
      const response = await scanText(ocrResult.text, madhab);

      setResult(response);
      addToHistory("image", response.product_name || "Image scan", response, madhab);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze image. Please try again.",
      );
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  }, []);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setBarcodeFallback(null);
    setLoadingStep(1);
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
      if (msg.includes("no ingredient data") || msg.includes("but no ingredient")) {
        // Extract product name from error message if present
        const nameMatch = msg.match(/Product '([^']+)'/);
        const productName = nameMatch ? nameMatch[1] : null;
        setBarcodeFallback(productName || "This product");
        setActiveTab("scan");
      } else if (msg.includes("not found")) {
        setBarcodeFallback(null);
        setActiveTab("scan");
        setError(
          "Product not in the database. Photograph the ingredient list instead."
        );
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  }, []);

  const handleTextSearch = useCallback(async (text: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setBarcodeFallback(null);
    setLoadingStep(1);
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
      setLoadingStep(0);
    }
  }, []);

  const resetScan = useCallback(() => {
    setResult(null);
    setError(null);
    setBarcodeFallback(null);
  }, []);

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={() => {
          setShowOnboarding(false);
          setCurrentMadhab(getMadhab());
        }}
      />
    );
  }

  if (result) {
    return <ScanResult result={result} onScanAnother={resetScan} />;
  }

  const activeIndex = TAB_CONFIG.findIndex((t) => t.key === activeTab);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="hero-card p-5 text-center space-y-2.5">
        <div className="relative flex items-center justify-center gap-2.5">
          <Image
            src="/halalchecker-log.png"
            alt="HalalChecker AI logo"
            width={44}
            height={44}
            className="drop-shadow-md"
            style={{ borderRadius: "50%", objectFit: "cover" }}
            priority
          />
          <h1 className="text-2xl font-bold gradient-text">HalalChecker AI</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Scan ingredients to check halal status
        </p>
        <div className="geometric-accent mx-auto max-w-[180px]" />

        {/* Current Madhab indicator — only renders after hydration to avoid mismatch */}
        {currentMadhab && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md press-scale"
            style={{
              background: "var(--color-halal-bg)",
              color: "var(--color-primary)",
              border: "1px solid var(--color-halal-light)",
            }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            {MADHAB_LABELS[currentMadhab as keyof typeof MADHAB_LABELS]} School
            <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        )}
      </div>

      {/* Tab selector */}
      <div
        className="relative flex p-1.5 rounded-xl"
        style={{ background: "var(--bg-muted)", border: "1px solid var(--border-default)" }}
        role="tablist"
        aria-label="Scan method"
      >
        {/* Sliding indicator */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-lg transition-all duration-300 ease-out"
          style={{
            width: `calc((100% - 12px) / 3)`,
            left: `calc(6px + ${activeIndex} * (100% - 12px) / 3)`,
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--border-card)",
          }}
        />
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setError(null);
              setBarcodeFallback(null);
            }}
            disabled={loading}
            className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200"
            style={{
              color: activeTab === tab.key ? "var(--color-primary)" : "var(--text-muted)",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Barcode fallback banner — shown when barcode product has no ingredients */}
      {barcodeFallback && (
        <div
          className="animate-slide-in-top rounded-xl p-4 text-sm"
          style={{
            background: "var(--color-mushbooh-bg)",
            border: "1.5px solid var(--color-mushbooh-light)",
            color: "var(--color-mushbooh)",
          }}
        >
          <div className="flex gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">{barcodeFallback}</p>
              <p className="mt-1 opacity-80" style={{ color: "var(--text-secondary)" }}>
                Product found in database but ingredients are missing. Take a photo of the ingredient list on the package.
              </p>
              <button
                onClick={() => setBarcodeFallback(null)}
                className="mt-2 text-xs font-medium underline underline-offset-2 opacity-60 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          className="animate-slide-in-top rounded-xl p-4 text-sm"
          style={{
            background: "var(--color-haram-bg)",
            border: "1.5px solid var(--color-haram-light)",
            color: "var(--color-haram)",
          }}
        >
          <div className="flex gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs font-medium underline underline-offset-2 opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && <LoadingSpinner message={loadingMessage} step={loadingStep} />}

      {/* Input components */}
      {!loading && (
        <div className="tab-content-enter" key={activeTab}>
          {activeTab === "scan" && (
            <div className="space-y-4">
              {/* Camera / Upload segmented control */}
              <div
                className="relative flex p-1 rounded-xl"
                style={{ background: "var(--bg-muted)", border: "1px solid var(--border-default)" }}
              >
                <div
                  className="absolute top-1 bottom-1 rounded-lg transition-all duration-200 ease-out"
                  style={{
                    width: "calc(50% - 4px)",
                    left: scanMode === "camera" ? "4px" : "calc(50%)",
                    background: "var(--bg-card)",
                    boxShadow: "var(--shadow-sm)",
                    border: "1px solid var(--color-primary)",
                  }}
                />
                <button
                  onClick={() => setScanMode("camera")}
                  className="relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    color: scanMode === "camera" ? "var(--color-primary)" : "var(--text-muted)",
                  }}
                >
                  Camera
                </button>
                <button
                  onClick={() => setScanMode("upload")}
                  className="relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    color: scanMode === "upload" ? "var(--color-primary)" : "var(--text-muted)",
                  }}
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
        </div>
      )}
    </div>
  );
}
