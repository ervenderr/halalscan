"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  disabled?: boolean;
}

export default function CameraCapture({
  onCapture,
  disabled = false,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setVideoReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setIsActive(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Failed to access camera. Try uploading an image instead.");
      }
    }
  }, []);

  // Attach stream to video element after it renders
  useEffect(() => {
    const video = videoRef.current;
    if (!isActive || !video || !streamRef.current) return;

    video.srcObject = streamRef.current;
    video.onloadedmetadata = () => {
      video.play().then(() => setVideoReady(true));
    };
  }, [isActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setVideoReady(false);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const maxWidth = 1920;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

    stopCamera();
    onCapture(base64);
  }, [onCapture, stopCamera]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!isActive ? (
        <button
          onClick={startCamera}
          disabled={disabled}
          className="w-full py-12 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center gap-3 hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          <span className="text-gray-600 font-medium">Open Camera</span>
          <span className="text-gray-400 text-xs">
            Point at the ingredient list on the package
          </span>
        </button>
      ) : (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-[4/3] object-cover"
          />
          {!videoReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capture}
              disabled={!videoReady}
              className="px-6 py-3 bg-green-600 text-white rounded-full font-medium shadow-lg hover:bg-green-700 disabled:opacity-50"
            >
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-gray-600 text-white rounded-full font-medium shadow-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
