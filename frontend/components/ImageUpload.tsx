"use client";

import { useRef, useState, useCallback } from "react";

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
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-green-400 bg-green-50"
            : "border-gray-300 hover:border-green-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Uploaded label"
            className="max-h-64 mx-auto rounded"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 cursor-pointer">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-gray-600 font-medium">
              Upload photo of ingredient list
            </span>
            <span className="text-gray-400 text-xs">
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
