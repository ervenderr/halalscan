"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
}

export default function BarcodeScanner({
  onScan,
  disabled = false,
}: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
      };

      const onSuccess = (decodedText: string) => {
        const cleaned = decodedText.replace(/\D/g, "");
        if (cleaned.length >= 8 && cleaned.length <= 13) {
          stopScanning();
          onScan(cleaned);
        }
      };

      // Try back camera first, fall back to any camera
      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          onSuccess,
          () => {},
        );
      } catch {
        await scanner.start(
          { facingMode: "user" },
          config,
          onSuccess,
          () => {},
        );
      }
    } catch (err) {
      setScanning(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowed") || msg.includes("Permission")) {
        setError("Camera access denied. Please allow camera permissions, or use manual entry.");
      } else if (msg.includes("NotFound") || msg.includes("Requested device not found")) {
        setError("No camera found. Use manual entry below.");
      } else {
        setError(`Scanner error: ${msg}. Use manual entry below.`);
      }
    }
  }, [onScan, stopScanning]);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const handleManualSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const cleaned = manualBarcode.trim();
      if (!/^\d{8,13}$/.test(cleaned)) {
        setError("Please enter a valid barcode (8-13 digits).");
        return;
      }
      onScan(cleaned);
    },
    [manualBarcode, onScan],
  );

  return (
    <div className="space-y-4">
      {/* Camera scanner */}
      {!scanning ? (
        <button
          onClick={startScanning}
          disabled={disabled}
          className="w-full py-10 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center gap-3 hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75H16.5v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
          </svg>
          <span className="text-gray-600 font-medium">Scan Barcode</span>
          <span className="text-gray-400 text-xs">
            Point camera at product barcode
          </span>
        </button>
      ) : (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <div id="barcode-reader" ref={containerRef} className="w-full" />
          <button
            onClick={stopScanning}
            className="absolute top-2 right-2 px-4 py-2 bg-gray-800/70 text-white rounded-full text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or enter manually</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Manual entry */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          placeholder="e.g., 3017620422003"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          disabled={disabled}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent tracking-wider"
        />
        <button
          type="submit"
          disabled={disabled || !manualBarcode.trim()}
          className="px-5 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          Look Up
        </button>
      </form>
    </div>
  );
}
