"use client";

import { useState } from "react";
import { IngredientResult, Status } from "@/lib/types";
import { getMadhab } from "@/lib/storage";
import { submitFeedback } from "@/lib/api";

interface FeedbackModalProps {
  ingredient: IngredientResult;
  onClose: () => void;
}

const STATUS_OPTIONS: { key: Status; label: string }[] = [
  { key: "halal", label: "Halal" },
  { key: "haram", label: "Haram" },
  { key: "mushbooh", label: "Mushbooh" },
];

type FeedbackType = "wrong_status" | "wrong_explanation" | "other";

export default function FeedbackModal({ ingredient, onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("wrong_status");
  const [reportedStatus, setReportedStatus] = useState<Status | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitFeedback({
        ingredient_name: ingredient.name,
        feedback_type: feedbackType,
        reported_status: feedbackType === "wrong_status" && reportedStatus ? reportedStatus : undefined,
        note: note.trim() || undefined,
        original_status: ingredient.status,
        madhab: getMadhab(),
      });
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-5 space-y-4 animate-slide-in-top"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-xl)", border: "1px solid var(--border-card)" }}
      >
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
              style={{ background: "var(--color-halal-bg)" }}
            >
              <svg className="w-7 h-7" style={{ color: "var(--color-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>Thank you!</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Your feedback helps improve accuracy.</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Report: {ingredient.name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Currently classified as {ingredient.status}
              </p>
            </div>

            {/* Feedback type */}
            <div className="space-y-2">
              {([
                { key: "wrong_status" as FeedbackType, label: "Wrong status" },
                { key: "wrong_explanation" as FeedbackType, label: "Wrong explanation" },
                { key: "other" as FeedbackType, label: "Other issue" },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFeedbackType(opt.key)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
                  style={{
                    background: feedbackType === opt.key ? "var(--color-halal-bg)" : "var(--bg-muted)",
                    border: feedbackType === opt.key ? "1.5px solid var(--color-primary)" : "1.5px solid transparent",
                    color: "var(--text-primary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Status correction */}
            {feedbackType === "wrong_status" && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>It should be:</p>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.filter((s) => s.key !== ingredient.status).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setReportedStatus(opt.key)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                      style={{
                        background: reportedStatus === opt.key ? "var(--color-halal-bg)" : "var(--bg-muted)",
                        border: reportedStatus === opt.key ? "1.5px solid var(--color-primary)" : "1.5px solid transparent",
                        color: "var(--text-primary)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            <textarea
              placeholder="Optional details..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium press-scale"
                style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || (feedbackType === "wrong_status" && !reportedStatus)}
                className="flex-1 py-2.5 btn-primary rounded-lg text-sm font-medium press-scale disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
