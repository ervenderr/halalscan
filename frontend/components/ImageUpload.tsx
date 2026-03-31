"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (imageBase64: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  onUpload,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("Image too large. Maximum size is 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        const base64 = dataUrl.split(",")[1];
        onUpload(base64);
      };
      reader.readAsDataURL(file);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div className="space-y-4">
      <div
        className={`glass-card glass-card-lift relative p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive ? "ring-2 ring-offset-2" : ""
        }`}
        style={{
          borderColor: dragActive ? "var(--color-primary)" : undefined,
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Uploaded label"
            width={300}
            height={256}
            className="max-h-64 w-auto mx-auto rounded-lg object-contain"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-3.5 py-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                border: "1.5px solid #a7f3d0",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.12)",
              }}
            >
              <svg className="w-8 h-8" style={{ color: "var(--color-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Upload photo of ingredient list
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Drag & drop or tap to select
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
      </div>
    </div>
  );
}
