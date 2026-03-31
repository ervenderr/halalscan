import { ClassificationResponse, Status, MADHAB_LABELS, Madhab } from "./types";

const STATUS_COLORS: Record<Status, string> = {
  halal: "#16a34a",
  haram: "#dc2626",
  mushbooh: "#d97706",
};

const STATUS_LABELS: Record<Status, string> = {
  halal: "HALAL",
  haram: "HARAM",
  mushbooh: "MUSHBOOH",
};

const STATUS_BG: Record<Status, string> = {
  halal: "#f0fdf4",
  haram: "#fef2f2",
  mushbooh: "#fffbeb",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateShareImage(
  result: ClassificationResponse,
  madhab: string,
): Promise<Blob> {
  const scale = 2;
  const W = 600;
  const H = 700;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  const statusColor = STATUS_COLORS[result.overall_status];
  const statusLabel = STATUS_LABELS[result.overall_status];
  const statusBg = STATUS_BG[result.overall_status];

  // Background
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 0, 0, W, H, 24);
  ctx.fill();

  // Top accent bar
  ctx.fillStyle = statusBg;
  roundRect(ctx, 0, 0, W, 260, 24);
  ctx.fill();
  // Cover bottom corners of accent
  ctx.fillStyle = statusBg;
  ctx.fillRect(0, 236, W, 24);

  // Logo
  try {
    const logo = await loadImage("/halalchecker-log.png");
    ctx.drawImage(logo, W / 2 - 24, 30, 48, 48);
  } catch {
    // Logo failed to load — skip
  }

  // Title
  ctx.fillStyle = "#15803d";
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("HalalChecker AI", W / 2, 102);

  // Product name
  if (result.product_name) {
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(
      result.product_name.length > 35 ? result.product_name.slice(0, 35) + "..." : result.product_name,
      W / 2, 140,
    );
  }

  // Status circle
  const circleY = result.product_name ? 185 : 165;
  ctx.beginPath();
  ctx.arc(W / 2, circleY, 32, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = statusColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Status icon
  ctx.strokeStyle = statusColor;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (result.overall_status === "halal") {
    ctx.beginPath();
    ctx.moveTo(W / 2 - 12, circleY);
    ctx.lineTo(W / 2 - 3, circleY + 10);
    ctx.lineTo(W / 2 + 14, circleY - 10);
    ctx.stroke();
  } else if (result.overall_status === "haram") {
    ctx.beginPath();
    ctx.moveTo(W / 2 - 10, circleY - 10);
    ctx.lineTo(W / 2 + 10, circleY + 10);
    ctx.moveTo(W / 2 + 10, circleY - 10);
    ctx.lineTo(W / 2 - 10, circleY + 10);
    ctx.stroke();
  } else {
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = statusColor;
    ctx.textAlign = "center";
    ctx.fillText("?", W / 2, circleY + 10);
  }

  // Status label
  ctx.fillStyle = statusColor;
  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(statusLabel, W / 2, circleY + 52);

  // Divider
  const divY = circleY + 72;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, divY);
  ctx.lineTo(W - 40, divY);
  ctx.stroke();

  // Stats
  const halal = result.ingredients.filter((i) => i.status === "halal").length;
  const haram = result.ingredients.filter((i) => i.status === "haram").length;
  const mushbooh = result.ingredients.filter((i) => i.status === "mushbooh").length;

  const statsY = divY + 30;
  ctx.font = "600 14px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";

  const stats = [
    { count: halal, label: "Halal", color: "#16a34a" },
    { count: haram, label: "Haram", color: "#dc2626" },
    { count: mushbooh, label: "Mushbooh", color: "#d97706" },
  ];

  const statsSpacing = 160;
  const statsStartX = W / 2 - statsSpacing;
  stats.forEach((s, i) => {
    const x = statsStartX + i * statsSpacing;
    // Dot
    ctx.beginPath();
    ctx.arc(x - 14, statsY - 4, 5, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.fill();
    // Text
    ctx.fillStyle = "#374151";
    ctx.textAlign = "left";
    ctx.fillText(`${s.count} ${s.label}`, x - 4, statsY);
  });

  // Summary
  ctx.textAlign = "center";
  ctx.fillStyle = "#475569";
  ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
  const summary = result.summary.length > 80 ? result.summary.slice(0, 80) + "..." : result.summary;
  ctx.fillText(summary, W / 2, statsY + 40);

  // Madhab
  const madhabLabel = MADHAB_LABELS[madhab as Madhab] || madhab;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(`Analyzed using ${madhabLabel} school`, W / 2, statsY + 70);

  // Ingredient list (compact)
  const listY = statsY + 100;
  const maxShow = Math.min(result.ingredients.length, 6);
  ctx.textAlign = "left";
  for (let i = 0; i < maxShow; i++) {
    const ing = result.ingredients[i];
    const y = listY + i * 24;
    // Status dot
    ctx.beginPath();
    ctx.arc(50, y - 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = STATUS_COLORS[ing.status];
    ctx.fill();
    // Name
    ctx.fillStyle = "#374151";
    ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
    const name = ing.name.length > 30 ? ing.name.slice(0, 30) + "..." : ing.name;
    ctx.fillText(name, 62, y);
    // Status
    ctx.fillStyle = STATUS_COLORS[ing.status];
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(ing.status.toUpperCase(), W - 50, y);
    ctx.textAlign = "left";
  }
  if (result.ingredients.length > 6) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`+${result.ingredients.length - 6} more ingredients`, 62, listY + maxShow * 24);
  }

  // Footer
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Scanned with HalalChecker AI", W / 2, H - 20);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to generate image"));
    }, "image/png");
  });
}

export async function shareOrDownload(blob: Blob, productName?: string | null): Promise<void> {
  const filename = `halal-check-${(productName || "scan").replace(/\s+/g, "-").toLowerCase()}.png`;
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "HalalChecker AI Result" });
    return;
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
