"use client";

import { useEffect, useLayoutEffect } from "react";
import { getTheme, applyTheme } from "@/lib/storage";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ThemeInit() {
  // Apply theme synchronously before first paint
  useIsomorphicLayoutEffect(() => {
    applyTheme(getTheme());
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getTheme() === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return null;
}
