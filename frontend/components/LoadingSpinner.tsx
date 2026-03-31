"use client";

interface LoadingSpinnerProps {
  message?: string;
  step?: number;
}

const STEPS = ["Reading", "Analyzing", "Done"];

export default function LoadingSpinner({
  message = "Analyzing ingredients...",
  step = 1,
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-fade-in">
      {/* Scanning visual */}
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid var(--color-halal-light)",
          }}
        />
        {/* Spinning gradient arc */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid transparent",
            borderTopColor: "var(--color-primary)",
            borderRightColor: "var(--color-primary)",
            animation: "spinGradient 1s linear infinite",
          }}
        />
        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "2px solid var(--color-primary)",
            animation: "pulseRing 2s ease-out infinite",
          }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-10 h-10" style={{ color: "var(--color-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          {/* Scan line */}
          <div
            className="absolute left-3 right-3 h-0.5 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
              animation: "scanLine 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Message */}
      <p className="text-sm font-medium animate-pulse" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const stepIndex = i + 1;
          const isActive = stepIndex === step;
          const isDone = stepIndex < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: isDone || isActive ? "var(--color-primary)" : "var(--border-default)",
                    transform: isActive ? "scale(1.3)" : "scale(1)",
                    boxShadow: isActive ? "var(--shadow-glow-green)" : "none",
                  }}
                />
                <span
                  className="text-xs transition-colors duration-300"
                  style={{
                    color: isDone || isActive ? "var(--color-primary)" : "var(--text-muted)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="w-6 h-px"
                  style={{ background: isDone ? "var(--color-primary)" : "var(--border-default)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Skeleton placeholders */}
      <div className="w-full space-y-3 mt-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="rounded-xl p-4 animate-pulse"
            style={{
              background: "var(--bg-muted)",
              opacity: 1 - n * 0.2,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg" style={{ background: "var(--border-default)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full w-2/3" style={{ background: "var(--border-default)" }} />
                <div className="h-2 rounded-full w-1/3" style={{ background: "var(--border-default)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
